// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lahan_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$daftarLahanHash() => r'254eaa2032f2448caaff96fd74590f96d997627a';

/// See also [daftarLahan].
@ProviderFor(daftarLahan)
final daftarLahanProvider =
    AutoDisposeFutureProvider<DaftarLahanResponse>.internal(
  daftarLahan,
  name: r'daftarLahanProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$daftarLahanHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef DaftarLahanRef = AutoDisposeFutureProviderRef<DaftarLahanResponse>;
String _$petaLahanHash() => r'7bd111324ee222d5c36a1b4de64a2bb7d84d1f47';

/// See also [petaLahan].
@ProviderFor(petaLahan)
final petaLahanProvider =
    AutoDisposeFutureProvider<Map<String, dynamic>>.internal(
  petaLahan,
  name: r'petaLahanProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$petaLahanHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef PetaLahanRef = AutoDisposeFutureProviderRef<Map<String, dynamic>>;
String _$detailLahanHash() => r'1c613b26b3cca4f0c97e5d52b02a2ed8fe5bfe44';

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

/// See also [detailLahan].
@ProviderFor(detailLahan)
const detailLahanProvider = DetailLahanFamily();

/// See also [detailLahan].
class DetailLahanFamily extends Family<AsyncValue<LahanDetail>> {
  /// See also [detailLahan].
  const DetailLahanFamily();

  /// See also [detailLahan].
  DetailLahanProvider call(
    String lahanId,
  ) {
    return DetailLahanProvider(
      lahanId,
    );
  }

  @override
  DetailLahanProvider getProviderOverride(
    covariant DetailLahanProvider provider,
  ) {
    return call(
      provider.lahanId,
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
  String? get name => r'detailLahanProvider';
}

/// See also [detailLahan].
class DetailLahanProvider extends AutoDisposeFutureProvider<LahanDetail> {
  /// See also [detailLahan].
  DetailLahanProvider(
    String lahanId,
  ) : this._internal(
          (ref) => detailLahan(
            ref as DetailLahanRef,
            lahanId,
          ),
          from: detailLahanProvider,
          name: r'detailLahanProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$detailLahanHash,
          dependencies: DetailLahanFamily._dependencies,
          allTransitiveDependencies:
              DetailLahanFamily._allTransitiveDependencies,
          lahanId: lahanId,
        );

  DetailLahanProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.lahanId,
  }) : super.internal();

  final String lahanId;

  @override
  Override overrideWith(
    FutureOr<LahanDetail> Function(DetailLahanRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DetailLahanProvider._internal(
        (ref) => create(ref as DetailLahanRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        lahanId: lahanId,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<LahanDetail> createElement() {
    return _DetailLahanProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DetailLahanProvider && other.lahanId == lahanId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, lahanId.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DetailLahanRef on AutoDisposeFutureProviderRef<LahanDetail> {
  /// The parameter `lahanId` of this provider.
  String get lahanId;
}

class _DetailLahanProviderElement
    extends AutoDisposeFutureProviderElement<LahanDetail> with DetailLahanRef {
  _DetailLahanProviderElement(super.provider);

  @override
  String get lahanId => (origin as DetailLahanProvider).lahanId;
}

String _$tambahLahanNotifierHash() =>
    r'4323fab49b7c073efd91bc55a5f6c9f6eadd14bd';

/// See also [TambahLahanNotifier].
@ProviderFor(TambahLahanNotifier)
final tambahLahanNotifierProvider =
    AutoDisposeNotifierProvider<TambahLahanNotifier, AsyncValue<void>>.internal(
  TambahLahanNotifier.new,
  name: r'tambahLahanNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$tambahLahanNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$TambahLahanNotifier = AutoDisposeNotifier<AsyncValue<void>>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
