// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'lahan_detail_page.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$detailLahanHash() => r'e6cd34700ad254318f0f329a73545988bfed8e83';

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
class DetailLahanFamily extends Family<AsyncValue<Map<String, dynamic>>> {
  /// See also [detailLahan].
  const DetailLahanFamily();

  /// See also [detailLahan].
  DetailLahanProvider call(
    String id,
  ) {
    return DetailLahanProvider(
      id,
    );
  }

  @override
  DetailLahanProvider getProviderOverride(
    covariant DetailLahanProvider provider,
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
  String? get name => r'detailLahanProvider';
}

/// See also [detailLahan].
class DetailLahanProvider
    extends AutoDisposeFutureProvider<Map<String, dynamic>> {
  /// See also [detailLahan].
  DetailLahanProvider(
    String id,
  ) : this._internal(
          (ref) => detailLahan(
            ref as DetailLahanRef,
            id,
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
          id: id,
        );

  DetailLahanProvider._internal(
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
    FutureOr<Map<String, dynamic>> Function(DetailLahanRef provider) create,
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
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<Map<String, dynamic>> createElement() {
    return _DetailLahanProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DetailLahanProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

mixin DetailLahanRef on AutoDisposeFutureProviderRef<Map<String, dynamic>> {
  /// The parameter `id` of this provider.
  String get id;
}

class _DetailLahanProviderElement
    extends AutoDisposeFutureProviderElement<Map<String, dynamic>>
    with DetailLahanRef {
  _DetailLahanProviderElement(super.provider);

  @override
  String get id => (origin as DetailLahanProvider).id;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member
