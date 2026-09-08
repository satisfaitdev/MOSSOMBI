import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';

class MossombiSliverAppBar extends StatelessWidget {
  final String title;
  final Widget? actionIcon;
  final VoidCallback? onActionTap;
  final double expandedHeight;
  final Widget? background;
  final int? badgeCount;

  const MossombiSliverAppBar({
    super.key,
    required this.title,
    this.actionIcon,
    this.onActionTap,
    this.expandedHeight = 120,
    this.background,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final canPop = context.canPop();

    return SliverAppBar(
      expandedHeight: expandedHeight,
      floating: false,
      pinned: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
      leadingWidth: 72,
      leading: canPop ? Padding(
        padding: const EdgeInsets.only(left: 16),
        child: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.arrow_back_ios_new_rounded, color: textColor, size: 20),
          ),
          onPressed: () => context.pop(),
        ),
      ) : null,
      actions: [
        if (actionIcon != null) ...[
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                  child: actionIcon,
                ),
                if (badgeCount != null && badgeCount! > 0)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.redAccent,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$badgeCount',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: onActionTap,
          ),
          const SizedBox(width: 8),
        ],
      ],
      flexibleSpace: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            color: isDark ? Colors.black.withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.4),
            child: FlexibleSpaceBar(
              centerTitle: true,
              titlePadding: const EdgeInsets.only(bottom: 16),
              title: Text(title, style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              )),
              background: background,
            ),
          ),
        ),
      ),
    );
  }
}

class MossombiAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final Widget? actionIcon;
  final VoidCallback? onActionTap;
  final Widget? customTitle;

  const MossombiAppBar({
    super.key,
    required this.title,
    this.actionIcon,
    this.onActionTap,
    this.customTitle,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    final canPop = context.canPop();

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: AppBar(
          backgroundColor: isDark ? Colors.black.withValues(alpha: 0.4) : Colors.white.withValues(alpha: 0.4),
          elevation: 0,
          centerTitle: true,
          systemOverlayStyle: SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
            statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
          ),
          title: customTitle ?? Text(title, style: TextStyle(
            color: textColor,
            fontWeight: FontWeight.w900,
            fontSize: 20,
            letterSpacing: -0.5,
          )),
          leadingWidth: 72,
          leading: canPop ? Padding(
            padding: const EdgeInsets.only(left: 16),
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.arrow_back_ios_new_rounded, color: textColor, size: 20),
              ),
              onPressed: () => context.pop(),
            ),
          ) : null,
          actions: [
            if (actionIcon != null) ...[
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.05),
                    shape: BoxShape.circle,
                  ),
                  child: actionIcon,
                ),
                onPressed: onActionTap,
              ),
              const SizedBox(width: 8),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class MossombiHeaderType1 extends StatelessWidget {
  final String title;
  final List<Widget>? actions;
  final bool isLoading;

  const MossombiHeaderType1({
    super.key,
    required this.title,
    this.actions,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.bgDark1;
    return SliverAppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      floating: true,
      snap: true,
      pinned: false,
      titleSpacing: 20,
      automaticallyImplyLeading: false,
      title: Text(title, style: TextStyle(color: textColor, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
      centerTitle: false,
      actions: [
        if (isLoading)
          const Padding(
            padding: EdgeInsets.only(right: 20),
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.violet),
            ),
          ),
        if (actions != null) ...actions!,
      ],
    );
  }
}

class MossombiHeaderType2 extends StatelessWidget {
  final String title;
  final Widget? actionIcon;
  final VoidCallback? onActionTap;
  final double expandedHeight;
  final int? badgeCount;

  const MossombiHeaderType2({
    super.key,
    required this.title,
    this.actionIcon,
    this.onActionTap,
    this.expandedHeight = 120,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    return MossombiSliverAppBar(
      title: title,
      actionIcon: actionIcon,
      onActionTap: onActionTap,
      expandedHeight: expandedHeight,
      badgeCount: badgeCount,
    );
  }
}

class MossombiHeaderType3 extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final Widget? actionIcon;
  final VoidCallback? onActionTap;

  const MossombiHeaderType3({
    super.key,
    required this.title,
    this.actionIcon,
    this.onActionTap,
  });

  @override
  Widget build(BuildContext context) {
    return MossombiAppBar(
      title: title,
      actionIcon: actionIcon,
      onActionTap: onActionTap,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class MossombiHeaderType4 extends StatelessWidget implements PreferredSizeWidget {
  final Widget? actionIcon;
  final VoidCallback? onActionTap;
  final int? badgeCount;

  const MossombiHeaderType4({
    super.key,
    this.actionIcon,
    this.onActionTap,
    this.badgeCount,
  });

  @override
  Widget build(BuildContext context) {
    final canPop = context.canPop();

    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
      leadingWidth: 72,
      leading: canPop
          ? Padding(
              padding: const EdgeInsets.only(left: 16),
              child: IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
                ),
                onPressed: () => context.pop(),
              ),
            )
          : null,
      actions: [
        if (actionIcon != null) ...[
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: actionIcon,
                ),
                if (badgeCount != null && badgeCount! > 0)
                  Positioned(
                    right: -4,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.redAccent,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '$badgeCount',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
              ],
            ),
            onPressed: onActionTap,
          ),
          const SizedBox(width: 12),
        ],
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
