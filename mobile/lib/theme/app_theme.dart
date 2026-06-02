import 'package:flutter/material.dart';

class AppTheme {
  // Warna brand Buruan Sae
  static const Color hijauPrimer = Color(0xFF2D7D32);
  static const Color hijauMuda = Color(0xFF4CAF50);
  static const Color hijauGelap = Color(0xFF1B5E20);
  static const Color kuning = Color(0xFFF9A825);
  static const Color kuningMuda = Color(0xFFFFF9C4);
  static const Color putih = Color(0xFFFFFFFF);
  static const Color abuAbu = Color(0xFF757575);
  static const Color abuMuda = Color(0xFFF5F5F5);
  static const Color merah = Color(0xFFD32F2F);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: hijauPrimer,
          primary: hijauPrimer,
          secondary: kuning,
          brightness: Brightness.light,
        ),
        fontFamily: 'Poppins',
        appBarTheme: const AppBarTheme(
          backgroundColor: hijauPrimer,
          foregroundColor: putih,
          elevation: 0,
          centerTitle: true,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: hijauPrimer,
            foregroundColor: putih,
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: hijauPrimer,
            side: const BorderSide(color: hijauPrimer),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: abuMuda,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: hijauPrimer, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: merah),
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          selectedItemColor: hijauPrimer,
          unselectedItemColor: abuAbu,
          showUnselectedLabels: true,
          type: BottomNavigationBarType.fixed,
        ),
        chipTheme: ChipThemeData(
          backgroundColor: kuningMuda,
          selectedColor: hijauMuda,
          labelStyle: const TextStyle(fontSize: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: hijauPrimer,
          primary: hijauMuda,
          secondary: kuning,
          brightness: Brightness.dark,
        ),
        fontFamily: 'Poppins',
      );
}
