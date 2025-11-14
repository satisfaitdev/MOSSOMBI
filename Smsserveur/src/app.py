#!/usr/bin/env python3
"""
📱 SERVEUR SMS MOSSOMBI - API REST
Solution 100% gratuite avec Gammu + Flask
"""

import os
import json
import uuid
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import gammu
import threading
import time
from functools import wraps
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Configuration de l'application
app = Flask(__name__)
CORS(app)

# Configuration du logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO')),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration globale
CONFIG = {
    'port': int(os.getenv('PORT', 8080)),
    'debug': os.getenv('DEBUG', 'false').lower() == 'true',
    'api_key': os.getenv('API_KEY', 'mossombi_sms_secret'),
    'modem_device': os.getenv('MODEM_DEVICE', '/dev/ttyUSB0'),
    'modem_connection': os.getenv('MODEM_CONNECTION', 'at'),
    'max_concurrent': int(os.getenv('MAX_CONCURRENT_SMS', 5)),
    'retry_attempts': int(os.getenv('RETRY_ATTEMPTS', 3)),
    'retry_delay': int(os.getenv('RETRY_DELAY', 30)),
}

# État global du service
SERVICE_STATE = {
    'initialized': False,
    'modem_connected': False,
    'last_check': None,
    'stats': {
        'sent': 0,
        'failed': 0,
        'pending': 0,
        'total_cost': 0.0
    },
    'queue': [],
    'processing': False
}

# Instance Gammu globale
sm = None

def init_gammu():
    """Initialiser la connexion Gammu"""
    global sm, SERVICE_STATE
    
    try:
        logger.info("🔧 Initialisation de Gammu...")
        
        sm = gammu.StateMachine()
        
        # Configuration Gammu
        config = {
            'Device': CONFIG['modem_device'],
            'Connection': CONFIG['modem_connection'],
        }
        
        sm.SetConfig(0, config)
        sm.Init()
        
        # Vérifier la connexion
        info = sm.GetManufacturer()
        model = sm.GetModel()
        
        SERVICE_STATE['initialized'] = True
        SERVICE_STATE['modem_connected'] = True
        SERVICE_STATE['last_check'] = datetime.now()
        
        logger.info(f"✅ Modem connecté: {info} {model}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erreur initialisation Gammu: {e}")
        SERVICE_STATE['initialized'] = False
        SERVICE_STATE['modem_connected'] = False
        return False

def require_api_key(f):
    """Décorateur pour vérifier la clé API"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        
        if not api_key or api_key != CONFIG['api_key']:
            return jsonify({
                'success': False,
                'error': 'Clé API invalide ou manquante',
                'code': 'INVALID_API_KEY'
            }), 401
            
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def before_request():
    """Middleware exécuté avant chaque requête"""
    g.request_id = str(uuid.uuid4())[:8]
    g.start_time = time.time()

@app.after_request
def after_request(response):
    """Middleware exécuté après chaque requête"""
    duration = time.time() - g.start_time
    logger.info(f"📡 {request.method} {request.path} - {response.status_code} - {duration:.3f}s - ID:{g.request_id}")
    return response

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du service"""
    return jsonify({
        'success': True,
        'service': 'Mossombi SMS Server',
        'version': '1.0.0',
        'status': 'healthy' if SERVICE_STATE['modem_connected'] else 'degraded',
        'timestamp': datetime.now().isoformat(),
        'modem_connected': SERVICE_STATE['modem_connected'],
        'stats': SERVICE_STATE['stats']
    })

@app.route('/status', methods=['GET'])
@require_api_key
def get_status():
    """Obtenir le statut détaillé du service"""
    try:
        # Vérifier la connexion modem
        if sm and SERVICE_STATE['modem_connected']:
            try:
                signal_quality = sm.GetSignalQuality()
                network_info = sm.GetNetworkInfo()
                battery_info = sm.GetBatteryCharge()
                
                modem_info = {
                    'signal_strength': signal_quality['SignalStrength'],
                    'signal_percent': signal_quality['SignalPercent'],
                    'network_name': network_info.get('NetworkName', 'Unknown'),
                    'network_code': network_info.get('NetworkCode', 'Unknown'),
                    'battery_percent': battery_info.get('BatteryPercent', 0)
                }
            except:
                modem_info = {'error': 'Impossible de récupérer les infos modem'}
        else:
            modem_info = {'error': 'Modem non connecté'}
        
        return jsonify({
            'success': True,
            'data': {
                'service_status': 'operational' if SERVICE_STATE['modem_connected'] else 'down',
                'modem_connected': SERVICE_STATE['modem_connected'],
                'last_check': SERVICE_STATE['last_check'].isoformat() if SERVICE_STATE['last_check'] else None,
                'queue_size': len(SERVICE_STATE['queue']),
                'processing': SERVICE_STATE['processing'],
                'stats': SERVICE_STATE['stats'],
                'modem_info': modem_info,
                'config': {
                    'device': CONFIG['modem_device'],
                    'connection': CONFIG['modem_connection'],
                    'max_concurrent': CONFIG['max_concurrent']
                }
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération statut: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/send-sms', methods=['POST'])
@require_api_key
def send_sms():
    """Envoyer un SMS"""
    try:
        data = request.get_json()
        
        # Validation des données
        if not data:
            return jsonify({
                'success': False,
                'error': 'Données JSON requises'
            }), 400
        
        to = data.get('to', '').strip()
        message = data.get('message', '').strip()
        priority = data.get('priority', 'normal')
        
        # Validations
        if not to or not message:
            return jsonify({
                'success': False,
                'error': 'Numéro de téléphone et message requis'
            }), 400
        
        if len(message) > 1600:
            return jsonify({
                'success': False,
                'error': 'Message trop long (max 1600 caractères)'
            }), 400
        
        # Normaliser le numéro
        if not to.startswith('+'):
            if to.startswith('0'):
                to = '+242' + to[1:]  # Congo
            elif not to.startswith('242'):
                to = '+242' + to
            else:
                to = '+' + to
        
        # Créer l'entrée SMS
        sms_entry = {
            'id': str(uuid.uuid4()),
            'to': to,
            'message': message,
            'priority': priority,
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'attempts': 0,
            'request_id': g.request_id
        }
        
        # Ajouter à la queue
        SERVICE_STATE['queue'].append(sms_entry)
        SERVICE_STATE['stats']['pending'] += 1
        
        logger.info(f"📱 SMS ajouté à la queue: {to} - ID:{sms_entry['id']}")
        
        # Démarrer le traitement si pas déjà en cours
        if not SERVICE_STATE['processing']:
            threading.Thread(target=process_sms_queue, daemon=True).start()
        
        return jsonify({
            'success': True,
            'message': 'SMS ajouté à la queue',
            'data': {
                'id': sms_entry['id'],
                'to': to,
                'status': 'queued',
                'queue_position': len(SERVICE_STATE['queue']),
                'estimated_send_time': (datetime.now() + timedelta(seconds=len(SERVICE_STATE['queue']) * 2)).isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur envoi SMS: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/sms-status/<sms_id>', methods=['GET'])
@require_api_key
def get_sms_status(sms_id):
    """Obtenir le statut d'un SMS"""
    try:
        # Chercher dans la queue
        for sms in SERVICE_STATE['queue']:
            if sms['id'] == sms_id:
                return jsonify({
                    'success': True,
                    'data': sms
                })
        
        return jsonify({
            'success': False,
            'error': 'SMS non trouvé'
        }), 404
        
    except Exception as e:
        logger.error(f"❌ Erreur récupération statut SMS: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def process_sms_queue():
    """Traiter la queue des SMS"""
    global SERVICE_STATE
    
    if SERVICE_STATE['processing']:
        return
    
    SERVICE_STATE['processing'] = True
    logger.info("🔄 Démarrage du traitement de la queue SMS")
    
    try:
        while SERVICE_STATE['queue']:
            sms = SERVICE_STATE['queue'][0]
            
            try:
                # Envoyer le SMS
                result = send_sms_via_gammu(sms)
                
                if result['success']:
                    SERVICE_STATE['stats']['sent'] += 1
                    SERVICE_STATE['stats']['pending'] -= 1
                    logger.info(f"✅ SMS envoyé: {sms['to']} - ID:{sms['id']}")
                else:
                    sms['attempts'] += 1
                    if sms['attempts'] >= CONFIG['retry_attempts']:
                        SERVICE_STATE['stats']['failed'] += 1
                        SERVICE_STATE['stats']['pending'] -= 1
                        logger.error(f"❌ SMS échoué définitivement: {sms['to']} - ID:{sms['id']}")
                    else:
                        logger.warning(f"⚠️ SMS échoué, tentative {sms['attempts']}: {sms['to']} - ID:{sms['id']}")
                        # Remettre à la fin de la queue
                        SERVICE_STATE['queue'].append(sms)
                
                # Retirer de la queue
                SERVICE_STATE['queue'].pop(0)
                
                # Délai entre les SMS
                time.sleep(2)
                
            except Exception as e:
                logger.error(f"❌ Erreur traitement SMS {sms['id']}: {e}")
                SERVICE_STATE['queue'].pop(0)
                SERVICE_STATE['stats']['failed'] += 1
                SERVICE_STATE['stats']['pending'] -= 1
    
    finally:
        SERVICE_STATE['processing'] = False
        logger.info("🏁 Traitement de la queue SMS terminé")

def send_sms_via_gammu(sms_entry):
    """Envoyer un SMS via Gammu"""
    try:
        if not sm or not SERVICE_STATE['modem_connected']:
            return {
                'success': False,
                'error': 'Modem non connecté'
            }
        
        # Préparer le SMS
        sms_info = {
            'Text': sms_entry['message'],
            'SMSC': {'Location': 1},
            'Number': sms_entry['to'],
        }
        
        # Envoyer
        sm.SendSMS(sms_info)
        
        sms_entry['status'] = 'sent'
        sms_entry['sent_at'] = datetime.now().isoformat()
        
        return {
            'success': True,
            'message_id': sms_entry['id'],
            'sent_at': sms_entry['sent_at']
        }
        
    except Exception as e:
        sms_entry['status'] = 'failed'
        sms_entry['error'] = str(e)
        
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/stats', methods=['GET'])
@require_api_key
def get_stats():
    """Obtenir les statistiques"""
    return jsonify({
        'success': True,
        'data': {
            'stats': SERVICE_STATE['stats'],
            'queue_size': len(SERVICE_STATE['queue']),
            'service_uptime': (datetime.now() - SERVICE_STATE['last_check']).total_seconds() if SERVICE_STATE['last_check'] else 0,
            'modem_status': 'connected' if SERVICE_STATE['modem_connected'] else 'disconnected'
        }
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint non trouvé',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Erreur interne du serveur',
        'code': 'INTERNAL_ERROR'
    }), 500

if __name__ == '__main__':
    logger.info("🚀 Démarrage du serveur SMS Mossombi...")
    
    # Initialiser Gammu
    if init_gammu():
        logger.info("✅ Service SMS prêt")
    else:
        logger.warning("⚠️ Service SMS en mode dégradé (modem non connecté)")
    
    # Démarrer le serveur
    app.run(
        host='0.0.0.0',
        port=CONFIG['port'],
        debug=CONFIG['debug']
    )
