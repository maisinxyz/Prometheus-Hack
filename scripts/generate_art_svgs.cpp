#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>

void writeSVG(const std::string& filename, const std::string& content) {
    std::ofstream file(filename);
    if (file.is_open()) {
        file << "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
        file << "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"512\" height=\"512\">\n";
        file << "  <defs>\n";
        file << "    <style>\n";
        file << "      .shadow { fill: rgba(0,0,0,0.25); }\n";
        file << "      .highlight { fill: rgba(255,255,255,0.3); }\n";
        file << "      .outline { stroke: #1a1a1a; stroke-width: 8; stroke-linejoin: round; stroke-linecap: round; }\n";
        file << "    </style>\n";
        file << "  </defs>\n";
        file << content;
        file << "</svg>\n";
        file.close();
        std::cout << "Generated " << filename << std::endl;
    } else {
        std::cerr << "Failed to open " << filename << " for writing." << std::endl;
    }
}

int main() {
    std::map<std::string, std::string> items;

    // 1. Squeezed Paint Tube
    items["squeezed_paint_tube.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Tube Body -->
            <path class="outline" fill="#C0C0C0" d="M 120 180 L 320 200 Q 350 210 380 250 Q 350 290 320 300 L 120 320 Z" />
            <path class="highlight" d="M 130 190 L 300 210 L 300 240 L 130 240 Z" />
            
            <!-- Crushed lines -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="round" d="M 150 185 L 170 230 L 190 190 L 220 260 L 250 195 L 280 280" />
            
            <!-- Label (Cadmium Red) -->
            <path class="outline" fill="#DC143C" d="M 180 200 L 300 215 L 290 285 L 180 290 Z" />
            <rect x="200" y="220" width="70" height="40" fill="#FFF" transform="rotate(4 200 220)" />
            <text x="210" y="245" font-family="sans-serif" font-size="14" font-weight="bold" fill="#111" transform="rotate(4 210 245)">CAD. RED</text>
            
            <!-- Tube Crimp End -->
            <rect x="100" y="170" width="30" height="160" class="outline" fill="#A9A9A9" />
            <path fill="none" stroke="#696969" stroke-width="4" d="M 110 180 L 120 180 M 110 200 L 120 200 M 110 220 L 120 220 M 110 240 L 120 240 M 110 260 L 120 260 M 110 280 L 120 280 M 110 300 L 120 300 M 110 320 L 120 320" />
            
            <!-- Cap and neck -->
            <path class="outline" fill="#111111" d="M 380 235 L 420 235 L 420 265 L 380 265 Z" />
            <!-- Spilled Paint -->
            <path fill="#DC143C" d="M 420 250 Q 450 250 460 280 Q 470 320 440 330 Q 410 340 400 300 Z" opacity="0.9" />
        </g>
    )SVG";

    // 2. Dried Clay Chunk
    items["dried_clay_chunk.svg"] = R"SVG(
        <g transform="rotate(-10 256 256)">
            <!-- Chunky irregular base -->
            <path class="outline" fill="#D2B48C" d="M 150 200 L 250 120 L 380 180 L 420 300 L 320 400 L 150 380 L 100 280 Z" />
            <path class="shadow" d="M 150 200 L 280 250 L 320 400 L 150 380 L 100 280 Z" />
            
            <!-- Highlighted facets -->
            <path class="highlight" d="M 150 200 L 250 120 L 280 250 Z" />
            <path fill="#F5DEB3" opacity="0.4" d="M 250 120 L 380 180 L 280 250 Z" />
            
            <!-- Cracks and fissures -->
            <path class="outline" fill="none" stroke-width="4" stroke-linejoin="round" d="M 280 250 L 380 180" />
            <path class="outline" fill="none" stroke-width="4" stroke-linejoin="round" d="M 280 250 L 420 300" />
            <path class="outline" fill="none" stroke-width="4" stroke-linejoin="round" d="M 280 250 L 320 400" />
            
            <!-- Small detailed cracks -->
            <path fill="none" stroke="#8B4513" stroke-width="3" d="M 180 220 L 220 240 L 210 270" opacity="0.6" />
            <path fill="none" stroke="#8B4513" stroke-width="3" d="M 300 320 L 340 300 L 360 330" opacity="0.6" />
            
            <!-- Crumbled bits -->
            <circle cx="120" cy="400" r="10" fill="#D2B48C" />
            <circle cx="90" cy="380" r="6" fill="#D2B48C" />
            <circle cx="410" cy="150" r="8" fill="#D2B48C" />
        </g>
    )SVG";

    // 3. Sketchbook Scrap
    items["sketchbook_scrap.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Torn paper piece -->
            <path class="outline" fill="#FDF5E6" d="M 120 100 L 350 120 L 400 380 L 150 400 Z" />
            
            <!-- Spiral binding holes on left edge -->
            <circle cx="125" cy="120" r="8" fill="#111" />
            <circle cx="130" cy="170" r="8" fill="#111" />
            <circle cx="135" cy="220" r="8" fill="#111" />
            <circle cx="140" cy="270" r="8" fill="#111" />
            <circle cx="145" cy="320" r="8" fill="#111" />
            <circle cx="150" cy="370" r="8" fill="#111" />
            
            <!-- Ripped edges (Top, Bottom, Right) -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="round" d="M 120 100 L 140 120 L 200 90 L 250 130 L 300 100 L 350 120" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="round" d="M 350 120 L 340 180 L 370 240 L 360 300 L 400 380" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="round" d="M 400 380 L 350 360 L 300 410 L 200 380 L 150 400" />
            
            <!-- Graphite Sketches (Eye & Scribbles) -->
            <path fill="none" stroke="#2F4F4F" stroke-width="4" stroke-linecap="round" d="M 200 200 Q 250 170 300 200 Q 250 230 200 200 Z" />
            <circle cx="250" cy="200" r="15" fill="#2F4F4F" />
            <!-- Crosshatching -->
            <path fill="none" stroke="#696969" stroke-width="2" d="M 180 280 L 280 250 M 190 300 L 290 270 M 200 320 L 300 290 M 220 250 L 280 320 M 200 270 L 260 340" />
            
            <!-- Smudges -->
            <circle cx="280" cy="320" r="30" fill="#696969" opacity="0.2" />
        </g>
    )SVG";

    // 4. Dirty Paint Brush
    items["dirty_paint_brush.svg"] = R"SVG(
        <g transform="rotate(45 256 256) translate(0, 50)">
            <!-- Wooden Handle -->
            <path class="outline" fill="#CD853F" d="M 150 100 L 170 100 L 180 300 L 140 300 Z" />
            <path class="highlight" d="M 155 100 L 165 100 L 165 300 L 145 300 Z" />
            
            <!-- Handle end -->
            <path class="outline" fill="#CD853F" d="M 150 100 Q 160 80 170 100 Z" />
            
            <!-- Metal Ferrule -->
            <rect x="140" y="300" width="40" height="40" class="outline" fill="#C0C0C0" />
            <path fill="none" stroke="#111" stroke-width="2" d="M 140 310 L 180 310 M 140 330 L 180 330" opacity="0.5" />
            <circle cx="160" cy="320" r="2" fill="#111" />
            
            <!-- Bristles (Stiff and crusty) -->
            <path class="outline" fill="#DEB887" d="M 140 340 L 180 340 L 190 420 Q 160 450 130 420 Z" />
            <!-- Bristle lines -->
            <path fill="none" stroke="#8B4513" stroke-width="2" d="M 145 340 L 140 400 M 155 340 L 155 420 M 165 340 L 165 420 M 175 340 L 180 400" />
            
            <!-- Dried Blue Paint on Bristles -->
            <path fill="#4682B4" d="M 135 380 Q 160 360 185 380 L 190 420 Q 160 450 130 420 Z" opacity="0.9" />
            
            <!-- Paint Splatters on Handle -->
            <circle cx="160" cy="200" r="5" fill="#4682B4" />
            <circle cx="150" cy="250" r="3" fill="#DC143C" />
            <circle cx="170" cy="150" r="4" fill="#FFD700" />
        </g>
    )SVG";

    // 5. Canvas Scrap
    items["canvas_scrap.svg"] = R"SVG(
        <g transform="rotate(-25 256 256)">
            <!-- Canvas Piece -->
            <path class="outline" fill="#F0E68C" d="M 120 150 L 320 120 L 350 350 L 150 380 Z" />
            
            <!-- Canvas Texture (Grid pattern) -->
            <path fill="none" stroke="#DDA0DD" stroke-width="2" stroke-dasharray="2 4" d="M 130 160 L 330 140 M 140 200 L 340 180 M 150 250 L 350 230 M 160 300 L 360 280 M 170 350 L 370 330" opacity="0.4" />
            <path fill="none" stroke="#DDA0DD" stroke-width="2" stroke-dasharray="2 4" d="M 150 140 L 170 350 M 200 140 L 220 350 M 250 130 L 270 360 M 300 120 L 320 350" opacity="0.4" />
            
            <!-- Torn Canvas Edges (Loose threads) -->
            <path class="outline" fill="none" stroke-width="6" d="M 120 150 L 130 130 L 150 160 L 180 120 L 220 150 L 260 110 L 290 140 L 320 120" />
            <path fill="none" stroke="#F0E68C" stroke-width="4" d="M 320 120 L 340 110 M 350 350 L 370 360 M 150 380 L 130 400" />
            
            <!-- Colorful Paint Smears -->
            <path fill="#FF4500" d="M 180 200 Q 220 180 250 220 Q 280 260 220 280 Q 150 300 180 200 Z" opacity="0.8" />
            <path fill="#1E90FF" d="M 240 250 Q 280 200 320 260 Q 300 320 260 300 Q 220 280 240 250 Z" opacity="0.8" />
            <path fill="#32CD32" d="M 150 300 Q 180 320 160 350 Q 140 330 150 300 Z" opacity="0.8" />
            
            <!-- Heavy palette knife strokes -->
            <rect x="200" y="220" width="60" height="15" fill="#FFD700" transform="rotate(-15 200 220)" />
            <rect x="250" y="270" width="50" height="12" fill="#FFF" transform="rotate(25 250 270)" />
        </g>
    )SVG";

    // 6. Empty Turpentine Bottle
    items["empty_turpentine_bottle.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Glass Body (Amber/Brown glass) -->
            <path class="outline" fill="#8B4513" d="M 180 150 L 340 150 L 360 220 L 360 400 A 20 20 0 0 1 340 420 L 180 420 A 20 20 0 0 1 160 400 L 160 220 Z" opacity="0.8" />
            <path class="highlight" d="M 170 230 L 200 230 L 200 400 L 170 400 Z" opacity="0.5" />
            
            <!-- Old Paper Label -->
            <path class="outline" fill="#F5F5DC" d="M 170 250 L 350 250 L 350 350 L 170 350 Z" />
            <!-- Label peeling -->
            <path class="outline" fill="#FFF8DC" d="M 350 250 L 310 250 L 350 290 Z" />
            
            <!-- Label Text and Skull icon for toxicity -->
            <text x="260" y="280" font-family="serif" font-size="24" font-weight="bold" fill="#111" text-anchor="middle">TURPENTINE</text>
            <circle cx="260" cy="310" r="15" fill="none" stroke="#111" stroke-width="4" />
            <path fill="#111" d="M 255 330 L 265 330 L 260 325 Z" />
            <path fill="none" stroke="#111" stroke-width="4" d="M 235 340 L 285 290 M 235 290 L 285 340" />
            
            <!-- Cap and Neck -->
            <rect x="230" y="100" width="60" height="50" class="outline" fill="#111" />
            <!-- Screw ridges -->
            <rect x="225" y="110" width="70" height="10" fill="#333" />
            <rect x="225" y="130" width="70" height="10" fill="#333" />
            
            <!-- Droplet of dried resin on side -->
            <path fill="#DAA520" d="M 160 200 Q 150 220 160 240 Q 170 220 160 200 Z" />
            
            <path class="shadow" d="M 160 350 L 360 350 L 360 420 L 160 420 Z" opacity="0.4" />
        </g>
    )SVG";

    // 7. Orange Peel (Artistic snack)
    items["orange_peel.svg"] = R"SVG(
        <g transform="rotate(45 256 256)">
            <!-- Main Spiral Peel -->
            <path class="outline" fill="#FF8C00" d="M 250 100 Q 400 100 400 250 Q 400 400 250 400 Q 150 400 150 300 Q 150 200 250 200 Q 320 200 320 270 Q 320 330 250 330 Q 210 330 210 290 Q 210 260 250 260 L 260 270 Q 230 270 230 290 Q 230 310 250 310 Q 300 310 300 270 Q 300 220 250 220 Q 170 220 170 300 Q 170 380 250 380 Q 380 380 380 250 Q 380 120 250 120 Z" />
            
            <!-- Inner White Pith showing -->
            <path fill="#FFFACD" d="M 250 120 Q 380 120 380 250 Q 380 380 250 380 Q 170 380 170 300 Q 170 220 250 220 Q 300 220 300 270 Q 300 310 250 310 Q 230 310 230 290 Q 230 270 260 270 L 260 260 L 250 260 Q 210 260 210 290 Q 210 330 250 330 Q 320 330 320 270 Q 320 200 250 200 Q 150 200 150 300 Q 150 400 250 400 Q 400 400 400 250 Q 400 100 250 100 Z" opacity="0.5" />
            
            <!-- Dimpled skin texture -->
            <circle cx="350" cy="200" r="3" fill="#D2691E" opacity="0.6" />
            <circle cx="300" cy="150" r="4" fill="#D2691E" opacity="0.6" />
            <circle cx="250" cy="110" r="3" fill="#D2691E" opacity="0.6" />
            <circle cx="370" cy="250" r="4" fill="#D2691E" opacity="0.6" />
            <circle cx="350" cy="320" r="3" fill="#D2691E" opacity="0.6" />
            <circle cx="280" cy="370" r="4" fill="#D2691E" opacity="0.6" />
            <circle cx="200" cy="350" r="3" fill="#D2691E" opacity="0.6" />
            <circle cx="180" cy="280" r="4" fill="#D2691E" opacity="0.6" />
        </g>
    )SVG";

    // 8. Eraser Shavings
    items["eraser_shavings.svg"] = R"SVG(
        <g>
            <!-- Large Shaving 1 -->
            <path class="outline" fill="#F5F5DC" d="M 200 200 Q 250 150 300 180 Q 320 200 280 230 Q 250 210 200 250 Q 180 270 150 230 Z" />
            
            <!-- Large Shaving 2 -->
            <path class="outline" fill="#F5F5DC" d="M 320 280 Q 400 220 420 300 Q 430 350 380 340 Q 320 330 320 280 Z" />
            
            <!-- Long coiled shaving -->
            <path class="outline" fill="none" stroke="#F5F5DC" stroke-width="20" d="M 150 350 Q 180 300 250 350 T 350 300 T 250 420 T 100 400" />
            
            <!-- Bits and dust -->
            <circle cx="280" cy="150" r="8" fill="#F5F5DC" class="outline" />
            <circle cx="350" cy="180" r="5" fill="#F5F5DC" class="outline" />
            <circle cx="120" cy="300" r="6" fill="#F5F5DC" class="outline" />
            <circle cx="200" cy="400" r="7" fill="#F5F5DC" class="outline" />
            <circle cx="380" cy="400" r="5" fill="#F5F5DC" class="outline" />
            
            <!-- Graphite dust mixed in -->
            <circle cx="220" cy="210" r="3" fill="#696969" />
            <circle cx="340" cy="290" r="4" fill="#696969" />
            <circle cx="260" cy="370" r="3" fill="#696969" />
            <circle cx="160" cy="370" r="5" fill="#696969" />
        </g>
    )SVG";

    // 9. Used Paint Palette
    items["used_paint_palette.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Wooden Palette Shape -->
            <path class="outline" fill="#DEB887" d="M 100 250 C 100 100, 300 50, 400 150 C 450 200, 450 350, 350 400 C 250 450, 100 400, 100 250 Z" />
            <path class="highlight" d="M 110 250 C 110 120, 280 80, 380 160 C 420 200, 420 330, 330 380 Z" />
            
            <!-- Thumb Hole -->
            <circle cx="330" cy="330" r="30" class="outline" fill="#2a2a2a" />
            <path fill="#CD853F" d="M 310 310 A 30 30 0 0 0 350 350" />
            
            <!-- Paint Blobs -->
            <path class="outline" fill="#DC143C" d="M 150 150 Q 180 130 190 160 Q 170 190 140 170 Z" /> <!-- Red -->
            <path class="outline" fill="#FFD700" d="M 230 120 Q 270 110 270 140 Q 250 160 220 140 Z" /> <!-- Yellow -->
            <path class="outline" fill="#1E90FF" d="M 320 130 Q 360 140 340 170 Q 310 180 300 150 Z" /> <!-- Blue -->
            <path class="outline" fill="#32CD32" d="M 380 200 Q 420 220 400 250 Q 370 260 360 220 Z" /> <!-- Green -->
            <path class="outline" fill="#FF8C00" d="M 120 220 Q 160 240 140 270 Q 110 260 110 240 Z" /> <!-- Orange -->
            <path class="outline" fill="#8A2BE2" d="M 140 300 Q 180 320 160 350 Q 120 340 130 310 Z" /> <!-- Purple -->
            <path class="outline" fill="#FFFFFF" d="M 220 350 Q 260 370 240 400 Q 210 390 200 370 Z" /> <!-- White -->
            
            <!-- Mixed muddy paint in center -->
            <path class="outline" fill="#8B4513" d="M 200 200 Q 280 180 300 240 Q 280 300 220 280 Q 180 260 200 200 Z" opacity="0.8" />
            <path fill="#556B2F" d="M 220 220 Q 260 200 280 240 Q 260 280 230 260 Z" opacity="0.7" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Art Studio SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
