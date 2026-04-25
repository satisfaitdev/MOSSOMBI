import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_gradients.dart';

class MosombiLoader extends StatelessWidget {
  final double size;
  const MosombiLoader({super.key, this.size = 50});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppGradients.primary,
        ),
        child: Padding(
          padding: const EdgeInsets.all(4.0),
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Theme.of(context).scaffoldBackgroundColor,
            ),
          ),
        ),
      )
          .animate(onPlay: (c) => c.repeat())
          .rotate(duration: 1.seconds, curve: Curves.linear)
          .shimmer(duration: 1.seconds),
    );
  }
}
