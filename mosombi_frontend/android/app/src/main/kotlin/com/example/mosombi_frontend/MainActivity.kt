package com.example.mosombi_frontend

import io.flutter.embedding.android.FlutterFragmentActivity
import android.os.Bundle
import androidx.core.view.WindowCompat

class MainActivity: FlutterFragmentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
    }
}
