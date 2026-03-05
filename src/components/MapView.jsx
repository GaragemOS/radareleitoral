import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../store';

const GEOJSON_URL = "https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-29-mun.json";

function getHeatmapColor(ratio) {
    // gradient: #0d1e30 (0%) → #1a4e6e (30%) → #c87800 (70%) → #f0a500 (100%)
    if (ratio > 0.7) return '#f0a500';
    if (ratio > 0.3) return '#c87800';
    if (ratio > 0.1) return '#1a4e6e';
    return '#0d1e30';
}

function getHeritageColor(captureRate) {
    if (captureRate > 0.70) return '#22c87a';
    if (captureRate > 0.50) return '#f0c040';
    if (captureRate > 0.20) return '#f0a500';
    return '#3a8ef0';
}

export default function MapView() {
    const [geoData, setGeoData] = useState(null);
    const geoJsonRef = useRef(null);
    const mode = useStore(state => state.mode);
    const candidateIndex = useStore(state => state.candidateIndex);
    const refCandidateIndex = useStore(state => state.refCandidateIndex);
    const selectedMunicipality = useStore(state => state.selectedMunicipality);
    const selectMunicipality = useStore(state => state.selectMunicipality);
    const closeSidebar = useStore(state => state.closeSidebar);
    const municipalData = useStore(state => state.municipalData);
    const safeCandidateIndex = candidateIndex !== null
        ? Math.min(candidateIndex, Object.values(municipalData)[0]?.votes.length - 1 || 0)
        : null;

    const safeRefIndex = refCandidateIndex !== null
        ? Math.min(refCandidateIndex, Object.values(municipalData)[0]?.votes.length - 1 || 0)
        : null;
    // const setNameToIbgeId = useStore(state => state.setNameToIbgeId);
    // const loadPopulationData = useStore(state => state.loadPopulationData);

    // Load GeoJSON once
    // useEffect(() => {
    //     fetch(GEOJSON_URL)
    //         .then(res => res.json())
    //         .then(data => {
    //             setGeoData(data);

    //             // Extrai mapa nome → ibgeId do GeoJSON
    //             const map = {};
    //             data.features.forEach(f => {
    //                 map[f.properties.name] = f.properties.id;
    //             });
    //             setNameToIbgeId(map);

    //             // Carrega população do IBGE
    //             // loadPopulationData();
    //         })
    //         .catch(err => console.error("Failed to load geojson", err));
    // }, []);
    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setGeoData(data))
            .catch(err => console.error("Failed to load geojson", err));
    }, []);
    // Pre-calculate max votes for heatmap scaling
    const maxVotesCache = useMemo(() => {
        let maxes = [];
        Object.values(municipalData).forEach(m => {
            m.votes.forEach((v, idx) => {
                maxes[idx] = Math.max(maxes[idx] || 0, v);
            });
        });
        return maxes;
    }, [municipalData]);

    // Function to determine style for a feature
    const getStyle = (feature, isHovered = false) => {
        const name = feature.properties.name;
        const isSelected = selectedMunicipality?.name === name;

        let fillColor = '#0d1e30';
        let fillOpacity = 0.8;
        let color = '#1e3450';
        let weight = 0.5;

        const data = municipalData[name];

        if (!data || safeCandidateIndex === null) {
            fillColor = '#0d1e30';
            fillOpacity = 0.3;
        } else {
            const currentVotes = data.votes[safeCandidateIndex] ?? 0;
            const refVotes = safeRefIndex !== null ? data.votes[safeRefIndex] ?? 0 : 0;

            if (mode === 'heritage' && safeRefIndex !== null) {
                fillColor = refVotes > 0 ? getHeritageColor(currentVotes / refVotes) : '#0d1e30';
            } else {
                const ratio = maxVotesCache[safeCandidateIndex] ? currentVotes / maxVotesCache[safeCandidateIndex] : 0;
                fillColor = getHeatmapColor(ratio);
            }
        }

        if (isHovered || isSelected) {
            color = '#f0a500';
            weight = 2.5;
            fillOpacity = 1;
        }

        return { fillColor, fillOpacity, color, weight };
    };

    // Restyle all layer when context changes securely via Leaflet ref
    useEffect(() => {
        if (geoJsonRef.current) {
            geoJsonRef.current.eachLayer(layer => {
                layer.setStyle(getStyle(layer.feature));
            });
        }
    }, [mode, candidateIndex, refCandidateIndex, selectedMunicipality, municipalData]);
    // const onEachFeature = (feature, layer) => {
    //     layer.on({
    //         mouseover: (e) => {
    //             const target = e.target;
    //             target.setStyle(getStyle(feature, true));
    //             target.bringToFront();
    //         },
    //         mouseout: (e) => {
    //             const target = e.target;
    //             target.setStyle(getStyle(feature, false));
    //             // Only bring it to front if it's the selected one, otherwise standard behavior
    //             if (selectedMunicipality?.name !== feature.properties.name) {
    //                 // leaflet default ordering
    //             } else {
    //                 target.bringToFront();
    //             }
    //         },
    //         click: (e) => {
    //             const title = feature.properties.name;
    //             if (selectedMunicipality?.name === title) {
    //                 closeSidebar();
    //             } else {
    //                 selectMunicipality(title, feature.properties);
    //             }
    //         }
    //     });
    // };
    const getStyleRef = useRef(null);
    getStyleRef.current = getStyle;

    const selectedMunicipalityRef = useRef(selectedMunicipality); // ✅ adicionar
    selectedMunicipalityRef.current = selectedMunicipality;        // ✅ atualiza a cada render

    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => {
                e.target.setStyle(getStyleRef.current(feature, true));
                e.target.bringToFront();
            },
            mouseout: (e) => {
                e.target.setStyle(getStyleRef.current(feature, false));
                if (selectedMunicipalityRef.current?.name === feature.properties.name) { // ✅
                    e.target.bringToFront();
                }
            },
            click: (e) => {
                const title = feature.properties.name;
                if (selectedMunicipalityRef.current?.name === title) { // ✅
                    closeSidebar();
                } else {
                    selectMunicipality(title, feature.properties);
                }
            }
        });
    };
    return (
        <div className="flex-1 w-full bg-[#08101e] relative pt-14 z-0">
            <MapContainer
                center={[-12.5, -41.7]}
                zoom={7}
                zoomControl={false}
                className="h-full w-full bg-[#08101e]"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    opacity={0.25}
                />
                {geoData && (
                    <GeoJSON
                        ref={geoJsonRef}
                        data={geoData}
                        style={(feature) => getStyle(feature, false)}
                        onEachFeature={onEachFeature}
                    />
                )}
            </MapContainer>
        </div>
    );
}
