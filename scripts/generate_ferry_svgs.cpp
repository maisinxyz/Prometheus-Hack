#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>

// Helper function to write an SVG file
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

    // 1. Ferry Ticket
    items["ferry_ticket.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Main Ticket Body -->
            <path class="outline" fill="#FFD700" d="M 120 150 L 380 150 L 380 350 L 120 350 Z" />
            <path fill="#FFA500" d="M 130 160 L 370 160 L 370 340 L 130 340 Z" />
            
            <!-- Stub tear line -->
            <path class="outline" fill="none" stroke-dasharray="15,10" d="M 300 150 L 300 350" />
            
            <!-- Ticket Details -->
            <text x="140" y="210" font-family="sans-serif" font-size="32" font-weight="bold" fill="#8B4500">NYC FERRY</text>
            <text x="140" y="250" font-family="sans-serif" font-size="20" fill="#8B4500">ADULT PASS - ONE WAY</text>
            
            <!-- Barcode -->
            <path stroke="#000" stroke-width="4" d="M 140 280 v 40 M 150 280 v 40 M 158 280 v 40 M 170 280 v 40 M 176 280 v 40 M 182 280 v 40 M 195 280 v 40 M 205 280 v 40 M 215 280 v 40" />
            
            <!-- Logo / Seal -->
            <circle cx="260" cy="200" r="25" class="outline" fill="#1E90FF" />
            <path fill="#FFF" d="M 245 205 L 275 205 L 260 185 Z" />
            
            <!-- Hole punch -->
            <circle cx="340" cy="250" r="15" fill="#111111" />
            <circle cx="340" cy="250" r="15" class="shadow" />
            
            <!-- Creases -->
            <path class="highlight" d="M 130 160 L 250 160 L 220 340 L 130 340 Z" />
            <path fill="none" stroke="#8B4500" stroke-width="2" d="M 180 160 L 170 340" />
        </g>
    )SVG";

    // 2. Barnacle Cup
    items["barnacle_cup.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Straw -->
            <path class="outline" fill="#DC143C" stroke-width="12" d="M 280 80 L 230 150" />
            
            <!-- Cup Body -->
            <path class="outline" fill="#F0F8FF" d="M 160 150 L 340 150 Q 350 400 300 420 L 200 420 Q 150 400 160 150 Z" />
            <path fill="#FFFFFF" d="M 170 160 L 330 160 Q 335 390 290 410 L 210 410 Q 165 390 170 160 Z" />
            
            <!-- Coffee Logo / Smudges -->
            <circle cx="250" cy="250" r="40" fill="#2E8B57" opacity="0.3" />
            
            <!-- Algae / Grime -->
            <path fill="#556B2F" opacity="0.4" d="M 170 300 Q 250 280 310 350 Q 250 420 170 400 Z" />
            <path fill="#8B4513" opacity="0.3" d="M 280 160 Q 320 250 330 200 Z" />

            <!-- Barnacle 1 -->
            <path class="outline" fill="#A9A9A9" d="M 160 280 L 190 250 L 210 290 Z" />
            <circle cx="185" cy="275" r="12" fill="#D3D3D3" />
            <circle cx="185" cy="275" r="6" fill="#2F4F4F" />

            <!-- Barnacle 2 -->
            <path class="outline" fill="#A9A9A9" d="M 280 340 L 320 310 L 340 360 L 290 380 Z" />
            <circle cx="310" cy="345" r="16" fill="#D3D3D3" />
            <circle cx="310" cy="345" r="8" fill="#2F4F4F" />

            <!-- Barnacle 3 -->
            <path class="outline" fill="#A9A9A9" d="M 220 370 L 250 350 L 270 380 L 230 400 Z" />
            <circle cx="245" cy="375" r="12" fill="#D3D3D3" />
            <circle cx="245" cy="375" r="5" fill="#2F4F4F" />

            <path class="shadow" d="M 170 160 L 220 160 Q 200 300 210 410 L 170 410 Z" />
            
            <!-- Crumple Lines -->
            <path fill="none" stroke="#B0C4DE" stroke-width="4" d="M 180 200 Q 220 220 200 280" />
            <path fill="none" stroke="#B0C4DE" stroke-width="4" d="M 310 220 L 280 260" />
        </g>
    )SVG";

    // 3. Tourist Map
    items["tourist_map.svg"] = R"SVG(
        <g transform="rotate(-5 256 256)">
            <!-- Map Sections (Folded) -->
            <path class="outline" fill="#FFF8DC" d="M 60 120 L 180 80 L 320 140 L 460 100 L 430 380 L 290 420 L 150 360 L 30 400 Z" />
            
            <!-- Left Fold -->
            <path fill="#F5DEB3" d="M 65 130 L 175 95 L 145 360 L 35 395 Z" />
            <!-- Center Fold -->
            <path fill="#FFE4B5" d="M 180 95 L 315 150 L 285 410 L 150 360 Z" />
            <!-- Right Fold -->
            <path fill="#DEB887" d="M 320 150 L 450 115 L 420 375 L 290 410 Z" />
            
            <!-- Water Features -->
            <path fill="#4682B4" opacity="0.6" d="M 150 120 Q 200 150 180 220 T 300 280 T 420 200 L 420 240 Q 300 320 180 260 T 130 160 Z" />
            <!-- Park Features -->
            <path fill="#32CD32" opacity="0.5" d="M 220 140 L 260 160 L 250 220 L 210 200 Z" />
            
            <!-- Roads -->
            <path fill="none" stroke="#D2B48C" stroke-width="6" d="M 80 200 L 150 180 L 250 250 L 350 220 L 420 300" />
            <path fill="none" stroke="#D2B48C" stroke-width="6" d="M 120 300 L 200 320 L 280 200 L 400 150" />
            
            <!-- X Marks the Spot -->
            <path fill="none" stroke="#FF0000" stroke-width="8" stroke-linecap="round" d="M 270 240 L 290 260 M 290 240 L 270 260" />
            
            <!-- Map Text -->
            <text x="340" y="160" font-family="sans-serif" font-size="28" font-weight="bold" fill="#8B4513" transform="rotate(-15 340 160)">NYC MAP</text>
            
            <path class="shadow" d="M 175 95 L 180 95 L 150 360 L 145 360 Z" />
            <path class="shadow" d="M 315 150 L 320 150 L 290 410 L 285 410 Z" />
            <path class="outline" fill="none" stroke-width="4" d="M 175 90 L 150 360" />
            <path class="outline" fill="none" stroke-width="4" d="M 320 140 L 290 415" />
        </g>
    )SVG";

    // 4. Soggy Fries
    items["soggy_fries.svg"] = R"SVG(
        <!-- Soggy / Drooping Fries -->
        <g stroke="#DAA520" stroke-width="4" stroke-linecap="round">
            <!-- Normal Fries -->
            <path fill="#FFD700" d="M 180 250 L 160 120 L 180 115 L 200 250 Z" />
            <path fill="#FFD700" d="M 220 250 L 240 90 L 260 95 L 240 250 Z" />
            <!-- Bent Soggy Fries -->
            <path fill="#BDB76B" d="M 260 250 L 280 150 Q 320 130 340 180 L 320 190 Q 300 150 270 160 L 250 250 Z" />
            <path fill="#BDB76B" d="M 300 250 L 320 180 Q 360 200 350 250 L 330 250 Q 340 210 310 200 L 290 250 Z" />
            <path fill="#FFD700" d="M 150 250 L 110 180 L 130 170 L 170 250 Z" />
            
            <!-- Green mold/sogginess -->
            <circle cx="270" cy="160" r="10" fill="#556B2F" opacity="0.6" />
            <circle cx="340" cy="220" r="8" fill="#556B2F" opacity="0.6" />
        </g>
        
        <!-- Fry Carton -->
        <path class="outline" fill="#DC143C" d="M 160 220 Q 250 270 340 220 L 310 440 L 190 440 Z" />
        <path fill="#B22222" d="M 170 240 Q 250 280 330 240 L 300 430 L 200 430 Z" />
        
        <!-- Logo (Yellow Smile/M) -->
        <path fill="none" stroke="#FFD700" stroke-width="12" stroke-linecap="round" d="M 220 320 Q 250 360 280 320" />
        
        <!-- Grease Stains -->
        <path fill="#800000" opacity="0.3" d="M 180 380 Q 220 350 250 430 L 200 430 Z" />
        <path fill="#800000" opacity="0.3" d="M 290 280 Q 320 320 280 360 Q 250 300 290 280 Z" />
        
        <path class="shadow" d="M 170 240 L 220 260 L 200 430 L 170 430 Z" />
    )SVG";

    // 5. Seasickness Pill Foil
    items["seasickness_pill_foil.svg"] = R"SVG(
        <g transform="rotate(20 256 256)">
            <!-- Blister Pack Base -->
            <path class="outline" fill="#C0C0C0" d="M 100 120 L 400 120 Q 420 120 420 140 L 420 360 Q 420 380 400 380 L 100 380 Q 80 380 80 360 L 80 140 Q 80 120 100 120 Z" />
            <path class="highlight" d="M 90 130 L 390 130 Q 410 130 410 150 L 410 350 Q 410 370 390 370 L 90 370 Q 70 370 70 350 L 70 150 Q 70 130 90 130 Z" />
            
            <!-- Grid Textures -->
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 180 130 L 180 370 M 260 130 L 260 370 M 340 130 L 340 370" />
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 90 250 L 410 250" />
            
            <!-- Intact Pills -->
            <g class="outline" fill="#FFFFFF">
                <circle cx="140" cy="180" r="25" />
                <circle cx="220" cy="180" r="25" />
                <!-- Popped space -->
                <circle cx="380" cy="180" r="25" />
                <circle cx="140" cy="320" r="25" />
                <circle cx="300" cy="320" r="25" />
            </g>
            <!-- Pill pink shading -->
            <g fill="#FFC0CB" opacity="0.6">
                <circle cx="145" cy="185" r="18" />
                <circle cx="225" cy="185" r="18" />
                <circle cx="385" cy="185" r="18" />
                <circle cx="145" cy="325" r="18" />
                <circle cx="305" cy="325" r="18" />
            </g>

            <!-- Popped Foil 1 -->
            <path class="outline" fill="#808080" d="M 280 160 L 320 160 L 315 210 L 285 200 Z" />
            <path fill="#A9A9A9" d="M 285 165 L 315 165 L 310 205 L 290 195 Z" />
            <!-- Pill exposed outside -->
            <circle cx="310" cy="140" r="15" class="outline" fill="#FFFFFF" />
            <circle cx="313" cy="143" r="10" fill="#FFC0CB" />
            
            <!-- Popped Foil 2 -->
            <path class="outline" fill="#808080" d="M 200 300 L 240 310 L 230 350 L 190 330 Z" />
            
            <text x="250" y="100" font-family="sans-serif" font-size="24" font-weight="bold" fill="#555" transform="rotate(-90 250 100)">SEACALM 500mg</text>
        </g>
    )SVG";

    // 6. Rusty Boat Cleat
    items["rusty_boat_cleat.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Rope tangled -->
            <path fill="none" class="outline" stroke="#D2B48C" stroke-width="20" d="M 50 150 Q 200 180 250 250 T 400 380" />
            
            <!-- Base of Cleat -->
            <path class="outline" fill="#5C4033" d="M 180 280 L 320 280 L 340 360 L 160 360 Z" />
            <path fill="#8B4513" d="M 190 290 L 310 290 L 330 350 L 170 350 Z" />
            <!-- Base Bolts -->
            <circle cx="210" cy="320" r="12" class="outline" fill="#3E2723" />
            <circle cx="290" cy="320" r="12" class="outline" fill="#3E2723" />
            
            <!-- Center Post -->
            <path class="outline" fill="#5C4033" d="M 220 230 L 280 230 L 290 280 L 210 280 Z" />
            <path fill="#8B4513" d="M 230 240 L 270 240 L 280 270 L 220 270 Z" />
            
            <!-- Horns (Top Bar) -->
            <path class="outline" fill="#5C4033" d="M 80 200 L 420 200 L 380 260 L 120 260 Z" />
            <path fill="#A0522D" d="M 90 210 L 410 210 L 370 250 L 130 250 Z" />
            <path class="highlight" d="M 100 215 L 400 215 L 380 225 L 120 225 Z" />
            
            <!-- Rust Spots -->
            <circle cx="150" cy="230" r="15" fill="#D2691E" opacity="0.8" />
            <path fill="#D2691E" opacity="0.8" d="M 350 220 Q 380 230 370 240 Q 330 240 350 220 Z" />
            <path fill="#CD5C5C" opacity="0.6" d="M 250 290 L 280 340 L 230 340 Z" />
            
            <!-- More Rope over the cleat -->
            <path fill="none" class="outline" stroke="#DEB887" stroke-width="20" d="M 230 200 Q 260 280 300 250 T 450 150" />
            <path fill="none" stroke="#8B4513" stroke-width="2" d="M 230 200 Q 260 280 300 250 T 450 150" stroke-dasharray="5 5" />
        </g>
    )SVG";

    // 7. Foam Life Preserver Piece
    items["foam_life_preserver_piece.svg"] = R"SVG(
        <g transform="rotate(30 256 256)">
            <!-- Main Preserver Arc -->
            <path class="outline" fill="#FF4500" d="M 80 150 A 250 250 0 0 1 430 150 L 350 250 A 150 150 0 0 0 160 250 Z" />
            <path fill="#FF6347" d="M 95 160 A 235 235 0 0 1 415 160 L 340 245 A 160 160 0 0 0 170 245 Z" />
            <path class="highlight" d="M 120 170 A 210 210 0 0 1 390 170 L 370 190 A 190 190 0 0 0 140 190 Z" />
            
            <!-- White Tape/Band 1 -->
            <path class="outline" fill="#FFFFFF" d="M 120 130 L 180 100 L 220 200 L 160 230 Z" />
            <path fill="#F5F5F5" d="M 130 135 L 175 110 L 210 195 L 165 220 Z" />
            
            <!-- White Tape/Band 2 -->
            <path class="outline" fill="#FFFFFF" d="M 330 100 L 390 130 L 350 230 L 290 200 Z" />
            <path fill="#F5F5F5" d="M 335 110 L 380 135 L 345 220 L 300 195 Z" />
            
            <!-- Jagged Broken Edges (Foam inside) -->
            <path class="outline" fill="#FFE4E1" d="M 70 140 L 90 160 L 60 180 L 100 200 L 70 230 L 130 250 L 160 260 L 150 220 Z" />
            <path class="outline" fill="#FFE4E1" d="M 440 140 L 420 160 L 450 180 L 410 200 L 440 230 L 380 250 L 350 260 L 360 220 Z" />
            <!-- Foam Texture -->
            <circle cx="100" cy="200" r="4" fill="#DCDCDC" />
            <circle cx="80" cy="170" r="3" fill="#DCDCDC" />
            <circle cx="130" cy="230" r="5" fill="#DCDCDC" />
            <circle cx="420" cy="200" r="4" fill="#DCDCDC" />
            <circle cx="430" cy="160" r="5" fill="#DCDCDC" />
            <circle cx="380" cy="230" r="3" fill="#DCDCDC" />
            
            <!-- Lettering -->
            <text x="220" y="140" font-family="sans-serif" font-size="40" font-weight="bold" fill="#8B0000" transform="rotate(15 220 140)">S.S.</text>
            <text x="270" y="160" font-family="sans-serif" font-size="40" font-weight="bold" fill="#8B0000" transform="rotate(30 270 160)">M</text>
        </g>
    )SVG";

    // 8. Tangled Fishing Line
    items["tangled_fishing_line.svg"] = R"SVG(
        <g>
            <!-- Seaweed tangled -->
            <path fill="none" stroke="#2E8B57" stroke-width="12" stroke-linecap="round" d="M 200 300 Q 250 400 350 350 Q 400 300 380 200" />
            <path fill="#2E8B57" d="M 350 350 Q 380 320 330 290 Z" />
            
            <!-- Mess of Line (Back) -->
            <path fill="none" stroke="#B0E0E6" stroke-width="6" d="M 100 200 Q 200 50 350 150 T 200 350 T 150 100 T 400 250 T 120 300 T 300 380 T 350 100 T 180 220" />
            
            <!-- Red/White Bobber -->
            <circle cx="280" cy="250" r="40" class="outline" fill="#FFFFFF" />
            <path fill="#FF0000" d="M 240 250 A 40 40 0 0 0 320 250 Z" />
            <!-- Bobber peg -->
            <rect x="275" y="200" width="10" height="20" fill="#FFFFFF" stroke="#1a1a1a" stroke-width="4" />
            <rect x="275" y="280" width="10" height="20" fill="#FF0000" stroke="#1a1a1a" stroke-width="4" />

            <!-- Mess of Line (Front) -->
            <path fill="none" stroke="#E0FFFF" stroke-width="8" d="M 250 100 Q 350 50 450 150 T 250 300 T 100 200 T 380 350 T 150 400 T 220 150 T 350 250 T 280 200" />
            <path fill="none" stroke="#FFFFFF" stroke-width="3" d="M 250 100 Q 350 50 450 150 T 250 300 T 100 200 T 380 350 T 150 400 T 220 150 T 350 250 T 280 200" />
            
            <!-- Small hook caught -->
            <path fill="none" stroke="#A9A9A9" stroke-width="6" d="M 120 300 L 120 330 A 15 15 0 0 0 150 330 L 150 320" />
            <circle cx="120" cy="295" r="4" fill="none" stroke="#A9A9A9" stroke-width="4" />
        </g>
    )SVG";

    // 9. Rusty Fishing Hook
    items["rusty_fishing_hook.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Snapped Line attached -->
            <path fill="none" stroke="#3CB371" stroke-width="8" stroke-dasharray="10 5" d="M 200 50 Q 250 0 300 80" />
            <path fill="none" stroke="#2E8B57" stroke-width="4" d="M 200 50 Q 250 0 300 80" />

            <!-- Hook Body -->
            <path fill="none" class="outline" stroke="#3E2723" stroke-width="30" stroke-linecap="round" d="M 300 120 L 300 350 A 100 100 0 0 0 480 350 L 480 280" />
            <path fill="none" stroke="#8B4513" stroke-width="20" stroke-linecap="round" d="M 300 125 L 300 350 A 100 100 0 0 0 480 350 L 480 285" />
            
            <!-- Hook Eyelet -->
            <circle cx="300" cy="90" r="30" class="outline" fill="none" stroke-width="25" />
            <circle cx="300" cy="90" r="30" fill="none" stroke="#8B4513" stroke-width="15" />
            
            <!-- Barb -->
            <path class="outline" fill="#3E2723" d="M 460 300 L 420 340 L 495 270 Z" />
            <path fill="#A0522D" d="M 460 305 L 435 330 L 485 285 Z" />

            <!-- Rust Details -->
            <path fill="none" stroke="#D2691E" stroke-width="6" d="M 295 180 L 295 250" />
            <path fill="none" stroke="#D2691E" stroke-width="8" d="M 300 350 A 100 100 0 0 0 400 440" />
            <circle cx="300" cy="200" r="6" fill="#FF4500" opacity="0.6" />
            <circle cx="310" cy="300" r="8" fill="#FF4500" opacity="0.6" />
            <circle cx="450" cy="380" r="5" fill="#FF4500" opacity="0.6" />
            
            <!-- Highlight -->
            <path fill="none" stroke="#CD853F" stroke-width="5" stroke-linecap="round" d="M 290 140 L 290 320" />
        </g>
    )SVG";

    // 10. Barnacle Shell
    items["barnacle_shell.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Main Shell Body -->
            <path class="outline" fill="#DCDCDC" d="M 100 400 Q 150 200 250 150 Q 350 200 400 400 Q 250 450 100 400 Z" />
            <path fill="#F8F8FF" d="M 120 390 Q 160 220 250 170 Q 340 220 380 390 Q 250 430 120 390 Z" />
            
            <!-- Striations / Ridges -->
            <path class="outline" fill="none" stroke-width="8" d="M 250 170 Q 250 280 250 410" />
            <path class="outline" fill="none" stroke-width="8" d="M 200 200 Q 180 300 170 400" />
            <path class="outline" fill="none" stroke-width="8" d="M 300 200 Q 320 300 330 400" />
            <path class="outline" fill="none" stroke-width="6" d="M 160 250 Q 140 320 130 395" />
            <path class="outline" fill="none" stroke-width="6" d="M 340 250 Q 360 320 370 395" />
            
            <!-- Coloring / Shading -->
            <path class="shadow" d="M 120 390 Q 180 250 250 170 L 250 410 Q 180 410 120 390 Z" />
            <path fill="#9370DB" opacity="0.2" d="M 250 170 Q 320 250 380 390 L 250 410 Z" />
            
            <!-- Top Opening (Volcano shape) -->
            <ellipse cx="250" cy="150" rx="40" ry="20" class="outline" fill="#2F4F4F" />
            <ellipse cx="250" cy="150" rx="30" ry="12" fill="#111111" />
            
            <!-- Small Barnacle Cluster on the side -->
            <path class="outline" fill="#A9A9A9" d="M 340 280 L 370 250 L 390 290 Z" />
            <circle cx="365" cy="275" r="15" fill="#D3D3D3" />
            <circle cx="365" cy="275" r="8" fill="#2F4F4F" />

            <path class="outline" fill="#A9A9A9" d="M 370 320 L 400 290 L 420 330 Z" />
            <circle cx="395" cy="315" r="18" fill="#D3D3D3" />
            <circle cx="395" cy="315" r="10" fill="#2F4F4F" />
            
            <!-- Algae / Moss base -->
            <path fill="#556B2F" opacity="0.4" d="M 100 400 Q 250 350 400 400 Q 250 450 100 400 Z" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Ferry Docks SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
