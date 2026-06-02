import 'package:json_annotation/json_annotation.dart';

part 'lahan_model.g.dart';

// ============================================================
// Model Lahan (JSON Serializable)
// ============================================================

@JsonSerializable()
class LahanSingkat {
  final String id;
  final String nama;
  final String alamat;
  final String kecamatan;
  final String kelurahan;
  @JsonKey(fromJson: _parseDouble)
  final double luas_m2;
  final String status;
  final String created_at;
  final PemilikInfo? pemilik;
  final KelompokInfo? kelompok;

  const LahanSingkat({
    required this.id,
    required this.nama,
    required this.alamat,
    required this.kecamatan,
    required this.kelurahan,
    required this.luas_m2,
    required this.status,
    required this.created_at,
    this.pemilik,
    this.kelompok,
  });

  factory LahanSingkat.fromJson(Map<String, dynamic> json) =>
      _$LahanSingkatFromJson(json);
  Map<String, dynamic> toJson() => _$LahanSingkatToJson(this);

  static double _parseDouble(dynamic val) =>
      val is num ? val.toDouble() : double.parse(val.toString());

  String get statusLabel {
    switch (status) {
      case 'AKTIF': return 'Aktif';
      case 'TIDAK_AKTIF': return 'Tidak Aktif';
      case 'DALAM_REVIEW': return 'Dalam Review';
      case 'DITOLAK': return 'Ditolak';
      default: return status;
    }
  }

  bool get isAktif => status == 'AKTIF';
}

@JsonSerializable()
class DaftarLahanResponse {
  final List<LahanSingkat> data;
  final int total;
  final int page;
  final int limit;
  final int totalHalaman;

  const DaftarLahanResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalHalaman,
  });

  factory DaftarLahanResponse.fromJson(Map<String, dynamic> json) =>
      _$DaftarLahanResponseFromJson(json);
}

@JsonSerializable()
class LahanDetail extends LahanSingkat {
  final String? catatan_verifikasi;
  final String? tgl_verifikasi;
  final List<FotoLahan> foto_lahan;
  final Map<String, dynamic>? geojson;
  final Map<String, dynamic>? titik_pusat_geojson;
  final LahanCount? count;

  const LahanDetail({
    required super.id,
    required super.nama,
    required super.alamat,
    required super.kecamatan,
    required super.kelurahan,
    required super.luas_m2,
    required super.status,
    required super.created_at,
    super.pemilik,
    super.kelompok,
    this.catatan_verifikasi,
    this.tgl_verifikasi,
    this.foto_lahan = const [],
    this.geojson,
    this.titik_pusat_geojson,
    this.count,
  });

  factory LahanDetail.fromJson(Map<String, dynamic> json) =>
      _$LahanDetailFromJson(json);
}

@JsonSerializable()
class FotoLahan {
  final String id;
  final String url;
  final String? keterangan;

  const FotoLahan({required this.id, required this.url, this.keterangan});

  factory FotoLahan.fromJson(Map<String, dynamic> json) =>
      _$FotoLahanFromJson(json);
}

@JsonSerializable()
class PemilikInfo {
  final String id;
  final String nama_lengkap;
  final String nomor_wa;

  const PemilikInfo({
    required this.id,
    required this.nama_lengkap,
    required this.nomor_wa,
  });

  factory PemilikInfo.fromJson(Map<String, dynamic> json) =>
      _$PemilikInfoFromJson(json);
}

@JsonSerializable()
class KelompokInfo {
  final String id;
  final String nama;

  const KelompokInfo({required this.id, required this.nama});

  factory KelompokInfo.fromJson(Map<String, dynamic> json) =>
      _$KelompokInfoFromJson(json);
}

@JsonSerializable()
class LahanCount {
  @JsonKey(name: 'catatan_panen')
  final int catatanPanen;

  const LahanCount({required this.catatanPanen});

  factory LahanCount.fromJson(Map<String, dynamic> json) =>
      _$LahanCountFromJson(json);
}
