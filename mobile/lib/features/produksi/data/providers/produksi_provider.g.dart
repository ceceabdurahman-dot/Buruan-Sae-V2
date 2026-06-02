// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'produksi_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$catatanPanenHash() => r'8a7c88ae6c74bae8b1a1c30d1e036422e88a5ef7';

/// See also [catatanPanen].
@ProviderFor(catatanPanen)
final catatanPanenProvider =
    AutoDisposeFutureProvider<Map<String, dynamic>>.internal(
  catatanPanen,
  name: r'catatanPanenProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$catatanPanenHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef CatatanPanenRef = AutoDisposeFutureProviderRef<Map<String, dynamic>>;
String _$ringkasanProduksiHash() => r'0cc84cf4215f1f0f9bc9b4b1d414c35c23852fdb';

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

/// See also [ringkasanProduksi].
@ProviderFor(ringkasanProduksi)
const ringkasanProduksiProvider = RingkasanProduksiFamily();

/// See also [ringkasanProduksi].
class RingkasanProduksiFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [ringkasanProduksi].
  const RingkasanProduksiFamily();

  /// See also [ringkasanProduksi].
  RingkasanProduksiProvider call(
    int tahun,
  ) {
    return RingkasanProduksiProvider(
      tahun,
    );
  }

  @override
  RingkasanProduksiProvider getProviderOverride(
    covariant RingkasanProduksiProvider provider,
  ) {
    return call(
      provider.tahun,
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
  String? get name => r'ringkasanProduksiProvider';
}

/// See also [ringkasanProduksi].
class RingkasanProduksiProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
  /// See also [ringkasanProduksi].
  RingkasanProduksiProvider(
    int tahun,
  ) : this._internal(
          (ref) => ringkasanProduksi(
            ref as RingkasanProduksiRef,
            tahun,
          ),
          from: ringkasanProduksiProvider,
          name: r'ringkasanProduksiProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$ringkasanProduksiHash,
          dependencies: RingkasanProduksiFamily._dependencies,
          allTransitiveDependencies:
              RingkasanProduksiFamily._allTransitiveDependencies,
          tahun: tahun,
        );

  RingkasanProduksiProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.tahun,
  }) : super.internal();

  final int tahun;

  @override
  Override overrideWith(
    FutureOr<Map<String, dynamic>> Function(RingkasanProduksiRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: RingkasanProduksiProvider._internal(
        (ref) => create(ref as RingkasanProduksiRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        tahun: tahun,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Map<String, dynamic>> createElement() {
    return _RingkasanProduksiProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is RingkasanProduksiProvider && other.tahun == tahun;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, tahun.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin RingkasanProduksiRef
    on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `tahun` of this provider.
  int get tahun;
}

class _RingkasanProduksiProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with RingkasanProduksiRef {
  _RingkasanProduksiProviderElement(super.provider);

  @override
  int get tahun => (origin as RingkasanProduksiProvider).tahun;
}

String _$komoditasHash() => r'e2784a95c0e624524bceb6eeec56d7e6aa9726eb';

/// See also [komoditas].
@ProviderFor(komoditas)
final komoditasProvider =
    AutoDisposeFutureProvider<List<Map<String, dynamic>>>.internal(
  komoditas,
  name: r'komoditasProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$komoditasHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef KomoditasRef = AutoDisposeFutureProviderRef<List<Map<String, dynamic>>>;
String _$lahanSingkatHash() => r'0b5cb6b50562f75df6ec9d9d1ea4ea6304dd0cdb';

/// See also [lahanSingkat].
@ProviderFor(lahanSingkat)
final lahanSingkatProvider =
    AutoDisposeFutureProvider<List<Map<String, dynamic>>>.internal(
  lahanSingkat,
  name: r'lahanSingkatProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$lahanSingkatHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef LahanSingkatRef
    = AutoDisposeFutureProviderRef<List<Map<String, dynamic>>>;
String _$tambahPanenNotifierHash() =>
    r'2179c12b3bd3e678874acf6b90d36ece2dc12752';

/// See also [TambahPanenNotifier].
@ProviderFor(TambahPanenNotifier)
final tambahPanenNotifierProvider =
    AutoDisposeNotifierProvider<TambahPanenNotifier, AsyncValue<void>>.internal(
  TambahPanenNotifier.new,
  name: r'tambahPanenNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$tambahPanenNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$TambahPanenNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
