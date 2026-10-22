'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker, LeafletMouseEvent } from 'leaflet';
import {
  MapPin,
  Search,
  Crosshair,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { getProvinces, getDistricts, getSubdistricts } from '@/app/data/thai_address';

// Leaflet CSS needs to be imported
import 'leaflet/dist/leaflet.css';

export interface NominatimAddress {
  province?: string;
  state?: string;
  amphoe?: string;
  district?: string;
  county?: string;
  city_district?: string;
  city?: string;
  tambon?: string;
  subdistrict?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  municipality?: string;
  village?: string;
  hamlet?: string;
  country?: string;
  [key: string]: string | undefined;
}

export interface NominatimReverseResponse {
  place_id?: number | string;
  licence?: string;
  osm_type?: string;
  osm_id?: number | string;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
  boundingbox?: string[];
  [key: string]: unknown;
}

interface LeafletContainerElement extends HTMLDivElement {
  _leaflet_id?: number;
}

export interface LocationCoords {
  lat: number;
  lng: number;
}

export interface AddressComponents {
  province: string;
  district: string;
  subdistrict: string;
  displayName?: string;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface FieldLocationMapProps {
  initialLat?: number | null;
  initialLng?: number | null;
  onConfirmLocation: (coords: LocationCoords | null, address?: AddressComponents | null) => void;
  onAddressDetected?: (address: AddressComponents, coords: LocationCoords) => void;
  disabled?: boolean;
}

// Default center: Thailand center (approx Phitsanulok/Nakhon Sawan)
const DEFAULT_CENTER: LocationCoords = { lat: 15.87, lng: 100.9925 };
const DEFAULT_ZOOM = 6;
const DETAIL_ZOOM = 16;

/**
 * Strips administrative prefixes and parenthesized notes from Thai place names
 */
export function cleanThaiPrefix(text: string, type: 'province' | 'district' | 'subdistrict'): string {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove parenthesized annotations like "(เมือง)" or "(ประเทศไทย)"
  cleaned = cleaned.replace(/\s*\([^)]*\)/g, '').trim();

  if (type === 'province') {
    cleaned = cleaned.replace(/^(จังหวัด|จ\.)\s*/, '');
  } else if (type === 'district') {
    cleaned = cleaned.replace(/^(อำเภอ|เขต|อ\.)\s*/, '');
  } else if (type === 'subdistrict') {
    cleaned = cleaned.replace(/^(ตำบล|แขวง|ต\.|เทศบาลตำบล|เทศบาลเมือง|เทศบาลนคร|อบต\.|ทต\.|ทม\.|ทน\.)\s*/, '');
  }
  return cleaned.trim();
}

/**
 * Matches cleaned province name with official Thai province list
 */
export function findMatchingProvince(rawProvince: string): string | null {
  if (!rawProvince) return null;
  const cleaned = cleanThaiPrefix(rawProvince, 'province');
  if (!cleaned) return null;

  const allProvinces = getProvinces();

  // 1. Exact match
  const exact = allProvinces.find(
    (p) => p === cleaned || p.replace(/\s+/g, '') === cleaned.replace(/\s+/g, '')
  );
  if (exact) return exact;

  // 2. Bangkok variations
  const lower = cleaned.toLowerCase();
  if (
    cleaned === 'กรุงเทพ' ||
    cleaned === 'กทม' ||
    cleaned === 'กทม.' ||
    lower === 'bangkok' ||
    cleaned.includes('กรุงเทพมหานคร')
  ) {
    return 'กรุงเทพมหานคร';
  }

  // 3. Ayutthaya variations (พระนครศรีอยุธยา / อยุธยา)
  if (cleaned === 'อยุธยา' || cleaned === 'พระนครศรีอยุธยา') {
    return 'พระนครศรีอยุธยา';
  }

  return null;
}

/**
 * Matches cleaned district name with official Thai district list for the given province
 */
export function findMatchingDistrict(
  rawDistrict: string,
  validDistricts: string[],
  provinceName?: string
): string | null {
  if (!rawDistrict || validDistricts.length === 0) return null;
  const cleaned = cleanThaiPrefix(rawDistrict, 'district');
  if (!cleaned) return null;

  // 1. Exact match (case/space-normalized)
  const exact = validDistricts.find(
    (d) => d === cleaned || d.replace(/\s+/g, '') === cleaned.replace(/\s+/g, '')
  );
  if (exact) return exact;

  // 2. If provinceName is known, handle "อำเภอเมือง" variations
  if (provinceName) {
    const cleanProv = cleanThaiPrefix(provinceName, 'province');
    if (cleaned === 'เมือง' || cleaned === 'เมือง' + cleanProv) {
      const mueangDist = validDistricts.find((d) => d === 'เมือง' + cleanProv || d.startsWith('เมือง'));
      if (mueangDist) return mueangDist;
    }

    if (cleaned === 'เมือง') {
      const mueang = validDistricts.find((d) => d.startsWith('เมือง'));
      if (mueang) return mueang;
    }
  }

  return null;
}

/**
 * Strictly matches cleaned subdistrict name against official Thai subdistricts
 */
export function findMatchingSubdistrict(
  rawSubdistrict: string,
  validSubdistricts: string[]
): string | null {
  if (!rawSubdistrict || validSubdistricts.length === 0) return null;
  const cleaned = cleanThaiPrefix(rawSubdistrict, 'subdistrict');
  if (!cleaned) return null;

  // Strict exact match against valid subdistricts for this province and district
  const exact = validSubdistricts.find(
    (s) => s === cleaned || s.replace(/\s+/g, '') === cleaned.replace(/\s+/g, '')
  );
  if (exact) return exact;

  return null;
}

/**
 * Matches cleaned OSM address components with official Thai address database
 */
export function matchWithThaiAddressData(
  rawProvince: string,
  rawDistrict: string,
  rawSubdistrict: string
): AddressComponents {
  const matchedProvince =
    findMatchingProvince(rawProvince) || cleanThaiPrefix(rawProvince, 'province');

  const allDistricts = matchedProvince ? getDistricts(matchedProvince) : [];
  const matchedDistrict =
    findMatchingDistrict(rawDistrict, allDistricts, matchedProvince) ||
    cleanThaiPrefix(rawDistrict, 'district');

  const validSubdistricts =
    matchedProvince && matchedDistrict
      ? getSubdistricts(matchedProvince, matchedDistrict)
      : [];

  const matchedSubdistrict =
    findMatchingSubdistrict(rawSubdistrict, validSubdistricts) || '';

  return {
    province: matchedProvince,
    district: matchedDistrict,
    subdistrict: matchedSubdistrict,
  };
}

/**
 * Parses Nominatim reverse geocode response into Thai address components
 */
export function parseNominatimAddress(data?: NominatimReverseResponse | null): AddressComponents {
  const address = data?.address || {};

  // 1. Extract and match Province
  let rawProvince = address.province || address.state || '';
  if (!rawProvince && address.city && address.city.includes('กรุงเทพ')) {
    rawProvince = 'กรุงเทพมหานคร';
  }
  const matchedProvince =
    findMatchingProvince(rawProvince) || cleanThaiPrefix(rawProvince, 'province');

  // 2. Extract and match District
  const allDistricts = matchedProvince ? getDistricts(matchedProvince) : [];
  const rawDistrict =
    address.amphoe ||
    address.district ||
    address.county ||
    address.city_district ||
    (!matchedProvince.includes('กรุงเทพ') && !rawProvince.toLowerCase().includes('bangkok')
      ? address.city
      : '') ||
    '';
  let matchedDistrict =
    findMatchingDistrict(rawDistrict, allDistricts, matchedProvince) ||
    cleanThaiPrefix(rawDistrict, 'district');

  // 3. Extract and match Subdistrict:
  // - NEVER use address.village or address.hamlet (Requirement: ห้ามนำ address.village หรือ address.hamlet มาใช้เป็นชื่อตำบล)
  // - Priority 1: Direct subdistrict fields (address.tambon, address.subdistrict)
  // - Priority 2: Municipality clue (address.municipality) - ONLY accepted if verified in official database
  // - Priority 3: Ambiguous fields (address.suburb, address.neighbourhood, address.quarter)
  //   ONLY accepted if verified to be an actual subdistrict in the official database!
  const validSubdistricts =
    matchedProvince && matchedDistrict
      ? getSubdistricts(matchedProvince, matchedDistrict)
      : [];

  let matchedSubdistrict = '';

  // Priority 1: Direct subdistrict fields from Nominatim
  const directCandidate = address.tambon || address.subdistrict || '';
  if (directCandidate) {
    const verified = findMatchingSubdistrict(directCandidate, validSubdistricts);
    if (verified) {
      matchedSubdistrict = verified;
    } else if (validSubdistricts.length === 0 && matchedProvince) {
      // If district was not resolved, search across all districts in this province
      const cleaned = cleanThaiPrefix(directCandidate, 'subdistrict');
      const allProvDistricts = getDistricts(matchedProvince);
      for (const d of allProvDistricts) {
        const subs = getSubdistricts(matchedProvince, d);
        const found = subs.find(
          (s) => s === cleaned || s.replace(/\s+/g, '') === cleaned.replace(/\s+/g, '')
        );
        if (found) {
          matchedSubdistrict = found;
          if (!matchedDistrict) {
            matchedDistrict = d;
          }
          break;
        }
      }
    }
  }

  // Priority 2: Municipality clue (address.municipality)
  // When direct fields are missing, check if municipality matches a verified subdistrict
  // MUST be verified against the official database; never assumed automatically
  if (!matchedSubdistrict && address.municipality) {
    const verified = findMatchingSubdistrict(address.municipality, validSubdistricts);
    if (verified) {
      matchedSubdistrict = verified;
    } else if (validSubdistricts.length === 0 && matchedProvince) {
      // If district was not resolved, search across all districts in this province
      const cleaned = cleanThaiPrefix(address.municipality, 'subdistrict');
      const allProvDistricts = getDistricts(matchedProvince);
      for (const d of allProvDistricts) {
        const subs = getSubdistricts(matchedProvince, d);
        const found = subs.find(
          (s) => s === cleaned || s.replace(/\s+/g, '') === cleaned.replace(/\s+/g, '')
        );
        if (found) {
          matchedSubdistrict = found;
          if (!matchedDistrict) {
            matchedDistrict = d;
          }
          break;
        }
      }
    }
  }

  // Priority 3: Ambiguous fields (suburb, neighbourhood, quarter)
  // STRICT RULE: ONLY accept if it exactly matches a verified subdistrict in validSubdistricts!
  if (!matchedSubdistrict) {
    const ambiguousCandidates = [
      address.suburb,
      address.neighbourhood,
      address.quarter,
    ].filter((item): item is string => Boolean(item));

    for (const amb of ambiguousCandidates) {
      const verified = findMatchingSubdistrict(amb, validSubdistricts);
      if (verified) {
        matchedSubdistrict = verified;
        break;
      }
    }
  }

  // If subdistrict cannot be identified with confidence, matchedSubdistrict remains ''
  // User can fill it manually in the form.

  return {
    province: matchedProvince,
    district: matchedDistrict,
    subdistrict: matchedSubdistrict,
    displayName: data?.display_name || '',
  };
}

export default function FieldLocationMap({
  initialLat,
  initialLng,
  onConfirmLocation,
  onAddressDetected,
  disabled = false,
}: FieldLocationMapProps) {
  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  // State
  const [currentCoords, setCurrentCoords] = useState<LocationCoords | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );
  const [confirmedCoords, setConfirmedCoords] = useState<LocationCoords | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Reverse Geocoding state
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<AddressComponents | null>(null);
  const [geocodeNote, setGeocodeNote] = useState<string | null>(null);
  const reverseGeocodeReqIdRef = useRef<number>(0);

  // Status message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Reverse Geocoding function with race condition protection
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      const reqId = ++reverseGeocodeReqIdRef.current;
      setIsGeocoding(true);
      setGeocodeNote(null);

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'th,en',
            },
          }
        );

        if (!res.ok) {
          throw new Error(`ดึงข้อมูลที่อยู่ไม่สำเร็จ (HTTP ${res.status})`);
        }

        const data: NominatimReverseResponse = await res.json();
        // Discard result if user has moved marker or clicked another place in the meantime
        if (reqId !== reverseGeocodeReqIdRef.current) return;

        const parsed = parseNominatimAddress(data);
        setGeocodedAddress(parsed);

        // Notify parent component immediately of detected address
        onAddressDetected?.(parsed, { lat, lng });

        // Inform user if some administrative components are missing
        const missing: string[] = [];
        if (!parsed.province) missing.push('จังหวัด');
        if (!parsed.district) missing.push('อำเภอ/เขต');
        if (!parsed.subdistrict) missing.push('ตำบล/แขวง');

        if (missing.length > 0) {
          setGeocodeNote(`ระบบไม่พบข้อมูล${missing.join(', ')} จากพิกัดนี้ กรุณาตรวจสอบหรือกรอกเพิ่มเติม`);
        }
      } catch {
        // Discard result if newer request has started
        if (reqId !== reverseGeocodeReqIdRef.current) return;
        // Do not crash or clear coordinates on reverse geocoding failure
        setGeocodeNote('ไม่สามารถดึงที่อยู่อัตโนมัติจากแผนที่ได้ กรุณาตรวจสอบหรือกรอกจังหวัด อำเภอ ตำบล ด้วยตนเอง');
      } finally {
        if (reqId === reverseGeocodeReqIdRef.current) {
          setIsGeocoding(false);
        }
      }
    },
    [onAddressDetected]
  );

  // Store reverseGeocode in ref for safe access inside Leaflet event callbacks
  const reverseGeocodeRef = useRef(reverseGeocode);
  useEffect(() => {
    reverseGeocodeRef.current = reverseGeocode;
  }, [reverseGeocode]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isCancelled = false;
    let localMap: LeafletMap | null = null;
    const containerNode = mapContainerRef.current as LeafletContainerElement | null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Dynamic import leaflet to prevent SSR issues
      const L = (await import('leaflet')).default;

      // If effect was cleaned up while importing leaflet, abort
      if (isCancelled || !mapContainerRef.current) return;

      // If an existing map instance is already running on this container, safely remove it
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Clear any lingering _leaflet_id on the DOM container (prevents "Map container is already initialized")
      const currentContainer = mapContainerRef.current as LeafletContainerElement | null;
      if (currentContainer?._leaflet_id) {
        delete currentContainer._leaflet_id;
      }

      // Fix default marker icon issue with Leaflet in bundlers
      delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initialCenter: [number, number] =
        initialLat != null && initialLng != null
          ? [initialLat, initialLng]
          : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
      const initialZoom = initialLat != null && initialLng != null ? DETAIL_ZOOM : DEFAULT_ZOOM;

      const map = L.map(mapContainerRef.current).setView(initialCenter, initialZoom);
      localMap = map;
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // If initial coordinates exist, place a draggable marker
      if (initialLat != null && initialLng != null) {
        const marker = L.marker([initialLat, initialLng], { draggable: !disabled }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const draggedCoords = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
          setCurrentCoords(draggedCoords);
          setStatusMessage(null);
          reverseGeocodeRef.current?.(draggedCoords.lat, draggedCoords.lng);
        });
      }

      // Map click handler to place / move marker
      map.on('click', (e: LeafletMouseEvent) => {
        if (disabled) return;
        const { lat, lng } = e.latlng;
        const newCoords = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
        setCurrentCoords(newCoords);
        setStatusMessage(null);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          markerRef.current = marker;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const draggedCoords = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
            setCurrentCoords(draggedCoords);
            setStatusMessage(null);
            reverseGeocodeRef.current?.(draggedCoords.lat, draggedCoords.lng);
          });
        }

        reverseGeocodeRef.current?.(newCoords.lat, newCoords.lng);
      });
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } else if (localMap) {
        localMap.remove();
      }
      markerRef.current = null;
      if (containerNode?._leaflet_id) {
        delete containerNode._leaflet_id;
      }
    };
  }, []); // Run once on mount

  // Sync external initial coordinates when they change (e.g. after edit page loads data)
  useEffect(() => {
    if (initialLat != null && initialLng != null && mapInstanceRef.current) {
      import('leaflet').then((module) => {
        const L = module.default;
        const map = mapInstanceRef.current;
        if (!map) return;
        const coords = { lat: initialLat, lng: initialLng };
        setCurrentCoords(coords);
        setConfirmedCoords(coords);

        map.setView([initialLat, initialLng], DETAIL_ZOOM);

        if (markerRef.current) {
          markerRef.current.setLatLng([initialLat, initialLng]);
        } else {
          const marker = L.marker([initialLat, initialLng], { draggable: !disabled }).addTo(map);
          markerRef.current = marker;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const draggedCoords = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
            setCurrentCoords(draggedCoords);
            setStatusMessage(null);
            reverseGeocodeRef.current?.(draggedCoords.lat, draggedCoords.lng);
          });
        }
      });
    }
  }, [initialLat, initialLng, disabled]);

  // Update marker position helper
  const updateMapPosition = useCallback(
    (lat: number, lng: number, zoom = DETAIL_ZOOM) => {
      if (!mapInstanceRef.current) return;

      import('leaflet').then((module) => {
        const L = module.default;
        const map = mapInstanceRef.current;
        if (!map) return;
        map.setView([lat, lng], zoom);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { draggable: !disabled }).addTo(map);
          markerRef.current = marker;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const draggedCoords = { lat: Number(pos.lat.toFixed(6)), lng: Number(pos.lng.toFixed(6)) };
            setCurrentCoords(draggedCoords);
            setStatusMessage(null);
            reverseGeocodeRef.current?.(draggedCoords.lat, draggedCoords.lng);
          });
        }
      });

      const roundedCoords = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      setCurrentCoords(roundedCoords);
      return roundedCoords;
    },
    [disabled]
  );

  // 1. Search Location via Nominatim API (Only on search submit, not keystroke)
  const handleSearch = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setShowResults(false);

    try {
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&countrycodes=th&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'th,en',
          },
        }
      );

      if (!res.ok) {
        throw new Error('ไม่สามารถค้นหาสถานที่ได้ในขณะนี้');
      }

      const data: SearchResult[] = await res.json();
      if (data.length === 0) {
        setSearchError('ไม่พบสถานที่ที่ค้นหา กรุณาลองพิมพ์ชื่ออื่นหรือคลิกบนแผนที่โดยตรง');
        setSearchResults([]);
      } else {
        setSearchResults(data);
        setShowResults(true);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    updateMapPosition(lat, lng, DETAIL_ZOOM);
    setShowResults(false);
    setSearchQuery(result.display_name.split(',')[0]);
    setStatusMessage('เลื่อนไปยังตำแหน่งที่เลือกแล้ว — กำลังดึงข้อมูลที่อยู่อัตโนมัติ...');
    reverseGeocode(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
  };

  // 2. Use Current GPS Location
  const handleUseGps = () => {
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับระบบ GPS');
      return;
    }

    setIsLocating(true);
    setStatusMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        updateMapPosition(lat, lng, DETAIL_ZOOM);
        setStatusMessage('พบตำแหน่ง GPS ปัจจุบันแล้ว — กำลังดึงข้อมูลที่อยู่อัตโนมัติ...');
        reverseGeocode(lat, lng);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('คุณไม่อนุญาตให้เข้าถึงตำแหน่ง GPS กรุณาเปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์ หรือใช้วิธีค้นหา/คลิกบนแผนที่');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('ไม่สามารถระบุตำแหน่ง GPS ได้ในขณะนี้ กรุณาลองใหม่หรือใช้วิธีคลิกบนแผนที่');
            break;
          case error.TIMEOUT:
            setGpsError('หมดเวลาค้นหาตำแหน่ง GPS กรุณาลองใหม่อีกครั้ง');
            break;
          default:
            setGpsError('เกิดข้อผิดพลาดในการระบุตำแหน่ง GPS');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  // 3. Confirm Location
  const handleConfirm = () => {
    if (!currentCoords) return;
    setConfirmedCoords(currentCoords);
    onConfirmLocation(currentCoords, geocodedAddress);
    setStatusMessage('ยืนยันตำแหน่งแปลงนาและที่อยู่เรียบร้อยแล้ว');
  };

  // Reset / Clear location
  const handleClearLocation = () => {
    if (markerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setCurrentCoords(null);
    setConfirmedCoords(null);
    setGeocodedAddress(null);
    setGeocodeNote(null);
    onConfirmLocation(null, null);
    setStatusMessage(null);
  };

  const isConfirmed =
    confirmedCoords != null &&
    currentCoords != null &&
    confirmedCoords.lat === currentCoords.lat &&
    confirmedCoords.lng === currentCoords.lng;

  return (
    <div className="space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-[#1A1F1C] flex items-center gap-1.5">
            <MapPin size={14} className="text-[#2D7048]" />
            <span>ระบุตำแหน่งแปลงนาบนแผนที่</span>
          </label>
          <p className="text-[11px] text-[#5A635D] mt-0.5">
            ค้นหาสถานที่ ปักหมุด หรือใช้ GPS ปัจจุบัน เพื่อระบุพิกัดและเติมที่อยู่อัตโนมัติ
          </p>
        </div>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseGps}
          disabled={disabled || isLocating}
          className="inline-flex items-center gap-1.5 px-3 h-8 text-xs font-medium text-[#2D7048] bg-[#E8F5EC] border border-[#B7DFC6] hover:bg-[#D6EDDD] rounded-md transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isLocating ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span>กำลังค้นหา GPS...</span>
            </>
          ) : (
            <>
              <Crosshair size={13} />
              <span>ใช้ตำแหน่ง GPS ปัจจุบัน</span>
            </>
          )}
        </button>
      </div>

      {/* Place Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearch();
                }
              }}
              placeholder="พิมพ์ชื่อสถานที่ ตำบล อำเภอ เพื่อค้นหา..."
              disabled={disabled || isSearching}
              className="w-full pl-8 pr-3 py-2 bg-white border border-[#CDD2CF] rounded-md text-xs text-[#1A1F1C] placeholder-[#9AA29D] focus:outline-none focus:border-[#2D7048] focus:ring-1 focus:ring-[#2D7048]"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-[#9AA29D]" />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSearch();
            }}
            disabled={disabled || isSearching || !searchQuery.trim()}
            className="px-4 h-9 text-xs font-medium text-white bg-[#2D7048] hover:bg-[#25593A] rounded-md transition-colors disabled:opacity-50 cursor-pointer shrink-0"
          >
            {isSearching ? <Loader2 size={13} className="animate-spin" /> : 'ค้นหา'}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <ul className="absolute z-1000 w-full mt-1 bg-white border border-[#E3E6E4] rounded-md shadow-lg max-h-52 overflow-y-auto">
            {searchResults.map((result) => (
              <li
                key={result.place_id}
                onClick={() => handleSelectSearchResult(result)}
                className="px-3 py-2 hover:bg-[#F7F8F7] cursor-pointer border-b border-[#E3E6E4] last:border-0 text-xs text-[#1A1F1C]"
              >
                <div className="font-medium truncate">{result.display_name.split(',')[0]}</div>
                <div className="text-[11px] text-[#5A635D] truncate">{result.display_name}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error Banners */}
      {searchError && (
        <div className="p-2.5 bg-[#FDECEA] border border-[#F4B9B3] rounded-md text-xs text-[#B42318] flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {gpsError && (
        <div className="p-2.5 bg-[#FDECEA] border border-[#F4B9B3] rounded-md text-xs text-[#B42318] flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative border border-[#CDD2CF] rounded-md overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-72 sm:h-80 z-0 bg-[#E8E8E8]" />

        {/* Overlay instruction */}
        <div className="absolute top-2 right-2 z-500 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] text-[#5A635D] shadow-xs border border-[#E3E6E4]">
          คลิกหรือลากหมุดบนแผนที่เพื่อปรับตำแหน่ง
        </div>
      </div>

      {/* Geocoding Status & Detected Address Bar */}
      {isGeocoding && (
        <div className="flex items-center gap-2 text-xs text-[#2D7048] bg-[#E8F5EC] p-2.5 rounded-md border border-[#B7DFC6]">
          <Loader2 size={13} className="animate-spin shrink-0" />
          <span>กำลังดึงข้อมูลที่อยู่อัตโนมัติจากพิกัด (ตำบล, อำเภอ, จังหวัด)...</span>
        </div>
      )}

      {!isGeocoding && geocodedAddress && (
        <div className="text-xs bg-[#F7F8F7] p-2.5 rounded-md border border-[#E3E6E4] space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 font-medium text-[#1A1F1C]">
            <CheckCircle2 size={14} className="text-[#2D7048] shrink-0" />
            <span>ที่อยู่ที่ตรวจพบ: </span>
            <span className="text-[#2D7048] font-semibold">
              {[
                geocodedAddress.subdistrict && `ต.${geocodedAddress.subdistrict}`,
                geocodedAddress.district && `อ.${geocodedAddress.district}`,
                geocodedAddress.province && `จ.${geocodedAddress.province}`,
              ]
                .filter(Boolean)
                .join(' ') || 'ไม่พบชื่อตำบล/อำเภอ/จังหวัดที่ชัดเจน'}
            </span>
          </div>
          {geocodeNote && (
            <p className="text-[11px] text-[#B54708] flex items-center gap-1 pt-0.5">
              <AlertCircle size={12} className="shrink-0" />
              <span>{geocodeNote}</span>
            </p>
          )}
        </div>
      )}

      {/* Coordinate Display & Confirmation Bar */}
      {currentCoords && (
        <div className="p-3 bg-[#F7F8F7] border border-[#E3E6E4] rounded-md space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs text-[#1A1F1C]">
              <span className="font-semibold text-[#5A635D]">พิกัดที่เลือก: </span>
              <span className="font-mono font-medium">
                ละติจูด {currentCoords.lat.toFixed(6)}, ลองจิจูด {currentCoords.lng.toFixed(6)}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearLocation}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-2.5 h-7 text-xs font-medium text-[#65716A] hover:text-[#B42318] hover:bg-white rounded border border-transparent hover:border-[#F4B9B3] transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>ลบพิกัด</span>
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={disabled || isConfirmed}
                className={`inline-flex items-center gap-1 px-3 h-7 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  isConfirmed
                    ? 'bg-[#E8F5EC] text-[#2D7048] border border-[#B7DFC6] cursor-default'
                    : 'bg-[#2D7048] hover:bg-[#25593A] text-white shadow-2xs'
                }`}
              >
                <Check size={13} />
                <span>{isConfirmed ? 'ยืนยันตำแหน่งแล้ว' : 'กดยืนยันตำแหน่งนี้'}</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <p className="text-[11px] text-[#2D7048] font-medium pt-1 border-t border-[#E3E6E4]">
              {statusMessage}
            </p>
          )}

          {!isConfirmed && (
            <p className="text-[11px] text-[#B54708] font-medium pt-1 border-t border-[#E3E6E4] flex items-center gap-1">
              <AlertCircle size={12} />
              <span>อย่าลืมกดปุ่ม &quot;กดยืนยันตำแหน่งนี้&quot; เพื่อบันทึกพิกัดพร้อมข้อมูลแปลง</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
