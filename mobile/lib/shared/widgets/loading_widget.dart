import 'package:flutter/material.dart';

class LoadingWidget extends StatelessWidget {
  final String pesan;

  const LoadingWidget({super.key, this.pesan = 'Memuat data...'});

  @override
  Widget build(BuildContext context) {
    return Center(
      key: const Key('lahan_list_skeleton'),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 12),
          Text(pesan, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
