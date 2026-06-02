// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'marketplace_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$daftarProdukHash() => r'f817459fedf0a61385aa54e552bcb941795f193f';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [daftarProduk].
@ProviderFor(daftarProduk)
const daftarProdukProvider = DaftarProdukFamily();

/// See also [daftarProduk].
class DaftarProdukFamily
    extends Family<AsyncValue<List<Map<String, dynamic>>>> {
  /// See also [daftarProduk].
  const DaftarProdukFamily();

  /// See also [daftarProduk].
  DaftarProdukProvider call({
    String sort = 'terbaru',
    String? kategori,
  }) {
    return DaftarProdukProvider(
      sort: sort,
      kategori: kategori,
    );
  }

  @override
  DaftarProdukProvider getProviderOverride(
    covariant DaftarProdukProvider provider,
  ) {
    return call(
      sort: provider.sort,
      kategori: provider.kategori,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'daftarProdukProvider';
}

/// See also [daftarProduk].
class DaftarProdukProvider
    extends AutoDisposeFutureProvider<List<Map<String, dynamic>>> {
  /// See also [daftarProduk].
  DaftarProdukProvider({
    String sort = 'terbaru',
    String? kategori,
  }) : this._internal(
          (ref) => daftarProduk(
            ref as DaftarProdukRef,
            sort: sort,
            kategori: kategori,
          ),
          from: daftarProdukProvider,
          name: r'daftarProdukProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$daftarProdukHash,
          dependencies: DaftarProdukFamily._dependencies,
          allTransitiveDependencies:
              DaftarProdukFamily._allTransitiveDependencies,
          sort: sort,
          kategori: kategori,
        );

  DaftarProdukProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.sort,
    required this.kategori,
  }) : super.internal();

  final String sort;
  final String? kategori;

  @override
  Override overrideWith(
    FutureOr<List<Map<String, dynamic>>> Function(DaftarProdukRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DaftarProdukProvider._internal(
        (ref) => create(ref as DaftarProdukRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        sort: sort,
        kategori: kategori,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Map<String, dynamic>>> createElement() {
    return _DaftarProdukProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DaftarProdukProvider &&
        other.sort == sort &&
        other.kategori == kategori;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, sort.hashCode);
    hash = _SystemHash.combine(hash, kategori.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DaftarProdukRef
    on AutoDisposeFutureProviderRef<List<Map<String, dynamic>>> {
  /// The parameter `sort` of this provider.
  String get sort;

  /// The parameter `kategori` of this provider.
  String? get kategori;
}

class _DaftarProdukProviderElement
    extends AutoDisposeFutureProviderElement<List<Map<String, dynamic>>>
    with DaftarProdukRef {
  _DaftarProdukProviderElement(super.provider);

  @override
  String get sort => (origin as DaftarProdukProvider).sort;
  @override
  String? get kategori => (origin as DaftarProdukProvider).kategori;
}

String _$detailProdukHash() => r'6c37ffaac7569bd2bd5d478970114480ce42deae';

/// See also [detailProduk].
@ProviderFor(detailProduk)
const detailProdukProvider = DetailProdukFamily();

/// See also [detailProduk].
class DetailProdukFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [detailProduk].
  const DetailProdukFamily();

  /// See also [detailProduk].
  DetailProdukProvider call(
    String id,
  ) {
    return DetailProdukProvider(
      id,
    );
  }

  @override
  DetailProdukProvider getProviderOverride(
    covariant DetailProdukProvider provider,
  ) {
    return call(
      provider.id,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'detailProdukProvider';
}

/// See also [detailProduk].
class DetailProdukProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
  /// See also [detailProduk].
  DetailProdukProvider(
    String id,
  ) : this._internal(
          (ref) => detailProduk(
            ref as DetailProdukRef,
            id,
          ),
          from: detailProdukProvider,
          name: r'detailProdukProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$detailProdukHash,
          dependencies: DetailProdukFamily._dependencies,
          allTransitiveDependencies:
              DetailProdukFamily._allTransitiveDependencies,
          id: id,
        );

  DetailProdukProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<Map<String, dynamic>> Function(DetailProdukRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DetailProdukProvider._internal(
        (ref) => create(ref as DetailProdukRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Map<String, dynamic>> createElement() {
    return _DetailProdukProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DetailProdukProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DetailProdukRef on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `id` of this provider.
  String get id;
}

class _DetailProdukProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with DetailProdukRef {
  _DetailProdukProviderElement(super.provider);

  @override
  String get id => (origin as DetailProdukProvider).id;
}

String _$daftarPesananSayaHash() => r'cf2158b56a8575bc3ea29f4f2a3d75b92845f2bd';

/// See also [daftarPesananSaya].
@ProviderFor(daftarPesananSaya)
final daftarPesananSayaProvider =
    AutoDisposeFutureProvider<List<Map<String, dynamic>>>.internal(
  daftarPesananSaya,
  name: r'daftarPesananSayaProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$daftarPesananSayaHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef DaftarPesananSayaRef
    = AutoDisposeFutureProviderRef<List<Map<String, dynamic>>>;
String _$buatPesananNotifierHash() =>
    r'd80b147db72177d9d650ff16f65dba46030500e1';

/// See also [BuatPesananNotifier].
@ProviderFor(BuatPesananNotifier)
final buatPesananNotifierProvider = AutoDisposeNotifierProvider<
    BuatPesananNotifier, AsyncValue<Map<String, dynamic>?>>.internal(
  BuatPesananNotifier.new,
  name: r'buatPesananNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$buatPesananNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$BuatPesananNotifier
    = AutoDisposeNotifier<AsyncValue<Map<String, dynamic>?>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
