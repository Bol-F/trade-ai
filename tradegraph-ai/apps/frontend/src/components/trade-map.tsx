"use client"

import { useEffect, useRef, useState } from "react"
import type { FeatureCollection, LineString } from "geojson"
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"
import type { MapFlow } from "@/lib/api"

export function arcCoordinates(start: [number, number], end: [number, number]): [number, number][] {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  const control: [number, number] = [
    (start[0] + end[0]) / 2 - dy * 0.16,
    (start[1] + end[1]) / 2 + dx * 0.08,
  ]
  return Array.from({ length: 25 }, (_, index) => {
    const t = index / 24
    const inverse = 1 - t
    return [
      inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
      inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1],
    ]
  })
}

export function TradeMap({ flows }: { flows: MapFlow[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let disposed = false
    void import("maplibre-gl").then((maplibregl) => {
      if (disposed || !containerRef.current) return
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://demotiles.maplibre.org/style.json",
        center: [45, 30],
        zoom: 1.3,
      })
      map.addControl(new maplibregl.NavigationControl(), "top-right")
      map.once("load", () => setMapReady(true))
      mapRef.current = map
    })
    return () => {
      disposed = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const update = async () => {
      const maplibregl = await import("maplibre-gl")
      const features: FeatureCollection<LineString>["features"] = flows.flatMap((flow) => {
        const { exporter, importer } = flow
        if (
          exporter.longitude === null || exporter.latitude === null ||
          importer.longitude === null || importer.latitude === null
        ) return []
        return [{
          type: "Feature" as const,
          geometry: {
            type: "LineString" as const,
            coordinates: arcCoordinates(
              [exporter.longitude, exporter.latitude],
              [importer.longitude, importer.latitude],
            ),
          },
          properties: {
            label: `${exporter.name} → ${importer.name}`,
            value: flow.trade_value_usd ?? 0,
          },
        }]
      })
      const collection: FeatureCollection<LineString> = { type: "FeatureCollection", features }
      const source = map.getSource("trade-flows")
      if (source) {
        const geoJsonSource = source as GeoJSONSource
        geoJsonSource.setData(collection)
        return
      }
      map.addSource("trade-flows", { type: "geojson", data: collection })
      map.addLayer({
        id: "trade-lines",
        type: "line",
        source: "trade-flows",
        paint: {
          "line-color": "#0d9488",
          "line-opacity": 0.8,
          "line-width": ["interpolate", ["linear"], ["get", "value"], 0, 1, 15000000, 8],
        },
      })
      map.addLayer({
        id: "trade-arrows",
        type: "symbol",
        source: "trade-flows",
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 180,
          "text-field": "→",
          "text-size": 15,
          "text-rotation-alignment": "map",
        },
        paint: { "text-color": "#0f766e" },
      })
      map.on("mouseenter", "trade-lines", (event) => {
        map.getCanvas().style.cursor = "pointer"
        const feature = event.features?.[0]
        if (!feature) return
        new maplibregl.Popup({ closeButton: false })
          .setLngLat(event.lngLat)
          .setText(`${String(feature.properties?.label)} · $${Number(feature.properties?.value).toLocaleString()}`)
          .addTo(map)
      })
      map.on("mouseleave", "trade-lines", () => { map.getCanvas().style.cursor = "" })
    }
    if (mapReady) void update()
  }, [flows, mapReady])

  return <div ref={containerRef} aria-label="Directional trade flow map" className="h-[560px] w-full rounded-xl" />
}
