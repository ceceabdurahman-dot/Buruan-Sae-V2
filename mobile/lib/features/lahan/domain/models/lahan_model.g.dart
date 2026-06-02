// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lahan_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LahanSingkat _$LahanSingkatFromJson(Map<String, dynamic> json) => LahanSingkat(
      id: json['id'] as String,
      nama: json['nama'] as String,
      alamat: json['alamat'] as String,
      kecamatan: json['kecamatan'] as String,
      kelurahan: json['kelurahan'] as String,
      luas_m2: LahanSingkat._parseDouble(json['luas_m2']),
      status: json['status'] as String,
      created_at: json['created_at'] as String,
      pemilik: json['pemilik'] == null
          ? null
          : PemilikInfo.fromJson(json['pemilik'] as Map<String, dynamic>),
      kelompok: json['kelompok'] == null
          ? null
          : KelompokInfo.fromJson(json['kelompok'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LahanSingkatToJson(LahanSingkat instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nama': instance.nama,
      'alamat': instance.alamat,
      'kecamatan': instance.kecamatan,
      'kelurahan': instance.kelurahan,
      'luas_m2': instance.luas_m2,
      'status': instance.status,
      'created_at': instance.created_at,
      'pemilik': instance.pemilik,
      'kelompok': instance.kelompok,
    };

DaftarLahanResponse _$DaftarLahanResponseFromJson(Map<String, dynamic> json) =>
    DaftarLahanResponse(
      data: (json['data'] as List<dynamic>)
          .map((e) => LahanSingkat.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
      totalHalaman: (json['totalHalaman'] as num).toInt(),
    );

Map<String, dynamic> _$DaftarLahanResponseToJson(
        DaftarLahanResponse instance) =>
    <String, dynamic>{
      'data': instance.data,
      'total': instance.total,
      'page': instance.page,
      'limit': instance.limit,
      'totalHalaman': instance.totalHalaman,
    };

LahanDetail _$LahanDetailFromJson(Map<String, dynamic> json) => LahanDetail(
      id: json['id'] as String,
      nama: json['nama'] as String,
      alamat: json['alamat'] as String,
      kecamatan: json['kecamatan'] as String,
      kelurahan: json['kelurahan'] as String,
      luas_m2: LahanSingkat._parseDouble(json['luas_m2']),
      status: json['status'] as String,
      created_at: json['created_at'] as String,
      pemilik: json['pemilik'] == null
          ? null
          : PemilikInfo.fromJson(json['pemilik'] as Map<String, dynamic>),
      kelompok: json['kelompok'] == null
          ? null
          : KelompokInfo.fromJson(json['kelompok'] as Map<String, dynamic>),
      catatan_verifikasi: json['catatan_verifikasi'] as String?,
      tgl_verifikasi: json['tgl_verifikasi'] as String?,
      foto_lahan: (json['foto_lahan'] as List<dynamic>?)
              ?.map((e) => FotoLahan.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      geojson: json['geojson'] as Map<String, dynamic>?,
      titik_pusat_geojson: json['titik_pusat_geojson'] as Map<String, dynamic>?,
      count: json['count'] == null
          ? null
          : LahanCount.fromJson(json['count'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$LahanDetailToJson(LahanDetail instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nama': instance.nama,
      'alamat': instance.alamat,
      'kecamatan': instance.kecamatan,
      'kelurahan': instance.kelurahan,
      'luas_m2': instance.luas_m2,
      'status': instance.status,
      'created_at': instance.created_at,
      'pemilik': instance.pemilik,
      'kelompok': instance.kelompok,
      'catatan_verifikasi': instance.catatan_verifikasi,
      'tgl_verifikasi': instance.tgl_verifikasi,
      'foto_lahan': instance.foto_lahan,
      'geojson': instance.geojson,
      'titik_pusat_geojson': instance.titik_pusat_geojson,
      'count': instance.count,
    };

FotoLahan _$FotoLahanFromJson(Map<String, dynamic> json) => FotoLahan(
      id: json['id'] as String,
      url: json['url'] as String,
      keterangan: json['keterangan'] as String?,
    );

Map<String, dynamic> _$FotoLahanToJson(FotoLahan instance) => <String, dynamic>{
      'id': instance.id,
      'url': instance.url,
      'keterangan': instance.keterangan,
    };

PemilikInfo _$PemilikInfoFromJson(Map<String, dynamic> json) => PemilikInfo(
      id: json['id'] as String,
      nama_lengkap: json['nama_lengkap'] as String,
      nomor_wa: json['nomor_wa'] as String,
    );

Map<String, dynamic> _$PemilikInfoToJson(PemilikInfo instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nama_lengkap': instance.nama_lengkap,
      'nomor_wa': instance.nomor_wa,
    };

KelompokInfo _$KelompokInfoFromJson(Map<String, dynamic> json) => KelompokInfo(
      id: json['id'] as String,
      nama: json['nama'] as String,
    );

Map<String, dynamic> _$KelompokInfoToJson(KelompokInfo instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nama': instance.nama,
    };

LahanCount _$LahanCountFromJson(Map<String, dynamic> json) => LahanCount(
      catatanPanen: (json['catatan_panen'] as num).toInt(),
    );

Map<String, dynamic> _$LahanCountToJson(LahanCount instance) =>
    <String, dynamic>{
      'catatan_panen': instance.catatanPanen,
    };
