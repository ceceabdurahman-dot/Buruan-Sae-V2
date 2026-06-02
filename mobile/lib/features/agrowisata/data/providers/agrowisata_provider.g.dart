// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'agrowisata_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$daftarPaketWisataHash() => r'ba911b17a87a058bd644d7fb0a54fab70e0a68b5';

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

/// See also [daftarPaketWisata].
@ProviderFor(daftarPaketWisata)
const daftarPaketWisataProvider = DaftarPaketWisataFamily();

/// See also [daftarPaketWisata].
class DaftarPaketWisataFamily
    extends Family<AsyncValue<List<Map<String, dynamic>>>> {
  /// See also [daftarPaketWisata].
  const DaftarPaketWisataFamily();

  /// See also [daftarPaketWisata].
  DaftarPaketWisataProvider call({
    String? status,
  }) {
    return DaftarPaketWisataProvider(
      status: status,
    );
  }

  @override
  DaftarPaketWisataProvider getProviderOverride(
    covariant DaftarPaketWisataProvider provider,
  ) {
    return call(
      status: provider.status,
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
  String? get name => r'daftarPaketWisataProvider';
}

/// See also [daftarPaketWisata].
class DaftarPaketWisataProvider
    extends AutoDisposeFutureProvider<List<Map<String, dynamic>>> {
  /// See also [daftarPaketWisata].
  DaftarPaketWisataProvider({
    String? status,
  }) : this._internal(
          (ref) => daftarPaketWisata(
            ref as DaftarPaketWisataRef,
            status: status,
          ),
          from: daftarPaketWisataProvider,
          name: r'daftarPaketWisataProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$daftarPaketWisataHash,
          dependencies: DaftarPaketWisataFamily._dependencies,
          allTransitiveDependencies:
              DaftarPaketWisataFamily._allTransitiveDependencies,
          status: status,
        );

  DaftarPaketWisataProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.status,
  }) : super.internal();

  final String? status;

  @override
  Override overrideWith(
    FutureOr<List<Map<String, dynamic>>> Function(DaftarPaketWisataRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DaftarPaketWisataProvider._internal(
        (ref) => create(ref as DaftarPaketWisataRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        status: status,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<List<Map<String, dynamic>>> createElement() {
    return _DaftarPaketWisataProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DaftarPaketWisataProvider && other.status == status;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, status.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DaftarPaketWisataRef
    on AutoDisposeFutureProviderRef<List<Map<String, dynamic>>> {
  /// The parameter `status` of this provider.
  String? get status;
}

class _DaftarPaketWisataProviderElement
    extends AutoDisposeFutureProviderElement<List<Map<String, dynamic>>>
    with DaftarPaketWisataRef {
  _DaftarPaketWisataProviderElement(super.provider);

  @override
  String? get status => (origin as DaftarPaketWisataProvider).status;
}

String _$detailPaketWisataHash() => r'c4b89b0abb0282a1362be9868591c09f47d01cbe';

/// See also [detailPaketWisata].
@ProviderFor(detailPaketWisata)
const detailPaketWisataProvider = DetailPaketWisataFamily();

/// See also [detailPaketWisata].
class DetailPaketWisataFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [detailPaketWisata].
  const DetailPaketWisataFamily();

  /// See also [detailPaketWisata].
  DetailPaketWisataProvider call(
    String id,
  ) {
    return DetailPaketWisataProvider(
      id,
    );
  }

  @override
  DetailPaketWisataProvider getProviderOverride(
    covariant DetailPaketWisataProvider provider,
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
  String? get name => r'detailPaketWisataProvider';
}

/// See also [detailPaketWisata].
class DetailPaketWisataProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
  /// See also [detailPaketWisata].
  DetailPaketWisataProvider(
    String id,
  ) : this._internal(
          (ref) => detailPaketWisata(
            ref as DetailPaketWisataRef,
            id,
          ),
          from: detailPaketWisataProvider,
          name: r'detailPaketWisataProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$detailPaketWisataHash,
          dependencies: DetailPaketWisataFamily._dependencies,
          allTransitiveDependencies:
              DetailPaketWisataFamily._allTransitiveDependencies,
          id: id,
        );

  DetailPaketWisataProvider._internal(
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
    FutureOr<Map<String, dynamic>> Function(DetailPaketWisataRef provider)
        create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DetailPaketWisataProvider._internal(
        (ref) => create(ref as DetailPaketWisataRef),
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
    return _DetailPaketWisataProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DetailPaketWisataProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DetailPaketWisataRef
    on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `id` of this provider.
  String get id;
}

class _DetailPaketWisataProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with DetailPaketWisataRef {
  _DetailPaketWisataProviderElement(super.provider);

  @override
  String get id => (origin as DetailPaketWisataProvider).id;
}

String _$daftarBookingSayaHash() => r'ede59bec2ed298c7c4316a34d2c8d66d79e9b727';

/// See also [daftarBookingSaya].
@ProviderFor(daftarBookingSaya)
final daftarBookingSayaProvider =
    AutoDisposeFutureProvider<List<Map<String, dynamic>>>.internal(
  daftarBookingSaya,
  name: r'daftarBookingSayaProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$daftarBookingSayaHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef DaftarBookingSayaRef
    = AutoDisposeFutureProviderRef<List<Map<String, dynamic>>>;
String _$buatBookingNotifierHash() =>
    r'a8dca7919f023e19b0c0cb03dd3bfdb71f55527c';

/// See also [BuatBookingNotifier].
@ProviderFor(BuatBookingNotifier)
final buatBookingNotifierProvider = AutoDisposeNotifierProvider<
    BuatBookingNotifier, AsyncValue<Map<String, dynamic>?>>.internal(
  BuatBookingNotifier.new,
  name: r'buatBookingNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$buatBookingNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$BuatBookingNotifier
    = AutoDisposeNotifier<AsyncValue<Map<String, dynamic>?>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
