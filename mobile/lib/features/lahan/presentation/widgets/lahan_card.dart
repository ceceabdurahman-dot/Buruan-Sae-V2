import 'package:flutter/material.dart';

import '../../domain/models/lahan_model.dart';

class LahanCard extends StatelessWidget {
  final LahanSingkat lahan;
  final VoidCallback? onTap;

  const LahanCard({super.key, required this.lahan, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: ListTile(
        onTap: onTap,
        leading: const CircleAvatar(child: Icon(Icons.landscape_outlined)),
        title: Text(lahan.nama),
        subtitle: Text('${lahan.kelurahan}, ${lahan.kecamatan}\n${lahan.luas_m2.toStringAsFixed(0)} m2'),
        isThreeLine: true,
        trailing: Chip(label: Text(lahan.statusLabel.toUpperCase())),
      ),
    );
  }
}
