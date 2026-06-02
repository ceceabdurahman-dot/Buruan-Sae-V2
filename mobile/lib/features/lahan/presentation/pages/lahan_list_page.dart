import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../data/providers/lahan_provider.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../widgets/lahan_card.dart';

// ============================================================
// Halaman Daftar Lahan — Tab Daftar + Tab Peta
// ============================================================

class LahanListPage extends ConsumerStatefulWidget {
  const LahanListPage({super.key});

  @override
  ConsumerState<LahanListPage> createState() => _LahanListPageState();
}

class _LahanListPageState extends ConsumerState<LahanListPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final MapController _mapController = MapController();

  // Bandung city center
  static const LatLng _pusatBandung = LatLng(-6.9175, 107.6191);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lahan Saya'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/lahan/tambah'),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.list), text: 'Daftar'),
            Tab(icon: Icon(Icons.map), text: 'Peta'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _DaftarTab(),
          _PetaTab(mapController: _mapController, pusatBandung: _pusatBandung),
        ],
      ),
    );
  }
}

// ============================================================
// Tab Daftar Lahan
// ============================================================

class _DaftarTab extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lahanAsync = ref.watch(daftarLahanProvider);

    return lahanAsync.when(
      loading: () => const LoadingWidget(pesan: 'Memuat daftar lahan...'),
      error: (err, _) => AppErrorWidget(
        pesan: err.toString(),
        onRetry: () => ref.invalidate(daftarLahanProvider),
      ),
      data: (response) {
        final daftar = response.data;

        if (daftar.isEmpty) {
          return _EmptyState();
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(daftarLahanProvider),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: daftar.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final lahan = daftar[index];
              return LahanCard(
                lahan: lahan,
                onTap: () => context.push('/lahan/${lahan.id}'),
              );
            },
          ),
        );
      },
    );
  }
}

// ============================================================
// Tab Peta Lahan (flutter_map + OpenStreetMap)
// ============================================================

class _PetaTab extends ConsumerWidget {
  final MapController mapController;
  final LatLng pusatBandung;

  const _PetaTab({required this.mapController, required this.pusatBandung});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final petaAsync = ref.watch(petaLahanProvider);

    return Stack(
      children: [
        FlutterMap(
          mapController: mapController,
          options: MapOptions(
            initialCenter: pusatBandung,
            initialZoom: 13.0,
            minZoom: 10.0,
            maxZoom: 19.0,
          ),
          children: [
            // Base tile — OpenStreetMap
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'id.go.bandung.buruansae',
            ),

            // Polygon lahan dari API
            petaAsync.when(
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
              data: (geojson) {
                final polygons = _parseGeoJson(geojson);
                return PolygonLayer(polygons: polygons);
              },
            ),

            // Attribution
            const RichAttributionWidget(
              attributions: [
                TextSourceAttribution('OpenStreetMap contributors'),
              ],
            ),
          ],
        ),

        // Loading overlay untuk peta
        petaAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const SizedBox.shrink(),
          data: (_) => const SizedBox.shrink(),
        ),

        // Tombol tambah lahan di peta
        Positioned(
          bottom: 24,
          right: 16,
          child: FloatingActionButton.extended(
            onPressed: () => context.push('/lahan/tambah'),
            icon: const Icon(Icons.add_location_alt),
            label: const Text('Tambah Lahan'),
            backgroundColor: const Color(0xFF2D7D32),
          ),
        ),
      ],
    );
  }

  List<Polygon> _parseGeoJson(Map<String, dynamic> geojson) {
    final polygons = <Polygon>[];
    final features = geojson['features'] as List? ?? [];

    for (final feature in features) {
      final geometry = feature['geometry'];
      final properties = feature['properties'] as Map<String, dynamic>? ?? {};

      if (geometry == null || geometry['type'] != 'Polygon') continue;

      final coordinates = geometry['coordinates'] as List;
      if (coordinates.isEmpty) continue;

      final outerRing = (coordinates[0] as List).map((coord) {
        final c = coord as List;
        return LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble());
      }).toList();

      polygons.add(Polygon(
        points: outerRing,
        color: const Color(0xFF4CAF50).withOpacity(0.3),
        borderColor: const Color(0xFF2D7D32),
        borderStrokeWidth: 2,
        label: properties['nama']?.toString(),
      ));
    }

    return polygons;
  }
}

// ============================================================
// Empty State
// ============================================================

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.landscape_outlined, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Belum ada lahan',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tambahkan lahan pertama Anda untuk mulai\nmemonitor produksi urban farming',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[500]),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => context.push('/lahan/tambah'),
            icon: const Icon(Icons.add_location_alt),
            label: const Text('Tambah Lahan'),
          ),
        ],
      ),
    );
  }
}
