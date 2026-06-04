import 'package:flutter/material.dart';

class AppTextStyles {
  const AppTextStyles._();

  static const display = TextStyle(
    fontSize: 28,
    height: 1.15,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.2,
  );

  static const title = TextStyle(
    fontSize: 20,
    height: 1.25,
    fontWeight: FontWeight.w800,
  );

  static const subtitle = TextStyle(
    fontSize: 16,
    height: 1.35,
    fontWeight: FontWeight.w700,
  );

  static const body = TextStyle(fontSize: 14, height: 1.45);
  static const caption = TextStyle(fontSize: 12, height: 1.35);
}
