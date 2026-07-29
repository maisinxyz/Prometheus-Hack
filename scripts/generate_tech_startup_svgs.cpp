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

    // 1. Broken Ethernet Cable
    items["broken_ethernet_cable.svg"] = R"SVG(
        <g>
            <!-- Coiled Cable -->
            <path class="outline" fill="none" stroke="#1E90FF" stroke-width="25" d="M 120 300 Q 80 150 250 120 T 400 250 T 250 380 T 150 200 L 150 150" />
            <path fill="none" stroke="#4169E1" stroke-width="12" d="M 120 300 Q 80 150 250 120 T 400 250 T 250 380 T 150 200 L 150 150" />
            
            <!-- Broken Wires at end -->
            <path fill="none" stroke="#FFA500" stroke-width="4" d="M 120 300 L 90 320 Q 70 330 80 350" />
            <path fill="none" stroke="#32CD32" stroke-width="4" d="M 115 305 L 80 330 Q 60 350 50 340" />
            <path fill="none" stroke="#8B4513" stroke-width="4" d="M 125 295 L 90 280 Q 70 270 60 290" />
            
            <!-- Connector Body (Clear plastic / Grey) -->
            <path class="outline" fill="#D3D3D3" d="M 130 140 L 170 140 L 170 80 L 130 80 Z" />
            <path fill="#F0F8FF" d="M 140 135 L 160 135 L 160 85 L 140 85 Z" />
            
            <!-- Snapped Clip -->
            <path class="outline" fill="none" stroke="#A9A9A9" stroke-width="6" d="M 170 120 L 190 100" />
            
            <!-- Gold Pins -->
            <rect x="142" y="80" width="2" height="15" fill="#FFD700" />
            <rect x="146" y="80" width="2" height="15" fill="#FFD700" />
            <rect x="150" y="80" width="2" height="15" fill="#FFD700" />
            <rect x="154" y="80" width="2" height="15" fill="#FFD700" />
            <rect x="158" y="80" width="2" height="15" fill="#FFD700" />
        </g>
    )SVG";

    // 2. VR Headset Foam
    items["vr_headset_foam.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Main Crescent Shape -->
            <path class="outline" fill="#2F4F4F" d="M 80 200 Q 250 50 420 200 Q 450 350 400 350 Q 250 150 100 350 Q 50 350 80 200 Z" />
            <path class="highlight" d="M 100 200 Q 250 80 400 200 Q 420 280 400 320 Q 250 170 100 320 Q 80 280 100 200 Z" />
            
            <!-- Velcro backing (Red/Orange edge) -->
            <path class="outline" fill="none" stroke="#CD5C5C" stroke-width="8" d="M 70 210 Q 250 40 430 210" />
            
            <!-- Foam Texture (Dimples) -->
            <circle cx="150" cy="200" r="4" fill="#111" opacity="0.4" />
            <circle cx="200" cy="150" r="3" fill="#111" opacity="0.4" />
            <circle cx="250" cy="130" r="5" fill="#111" opacity="0.4" />
            <circle cx="300" cy="150" r="4" fill="#111" opacity="0.4" />
            <circle cx="350" cy="200" r="4" fill="#111" opacity="0.4" />
            <circle cx="120" cy="250" r="3" fill="#111" opacity="0.4" />
            <circle cx="380" cy="250" r="5" fill="#111" opacity="0.4" />
            
            <!-- Ripped end -->
            <path class="outline" fill="#1a1a1a" d="M 400 350 L 420 330 L 400 310 L 430 280 Z" />
            <path fill="#2F4F4F" d="M 405 345 L 415 330 L 405 315 L 420 285 Z" />
        </g>
    )SVG";

    // 3. Keyboard Keycap
    items["keyboard_keycap.svg"] = R"SVG(
        <g transform="rotate(-15 256 256) translate(0, 50)">
            <!-- Base Shadow / Skirt -->
            <path class="outline" fill="#A9A9A9" d="M 100 250 L 300 250 L 350 400 L 50 400 Z" />
            <path fill="#808080" d="M 110 260 L 290 260 L 340 390 L 60 390 Z" />
            
            <!-- Inner stem (Cherry MX cross) seen from bottom -->
            <circle cx="200" cy="325" r="40" class="outline" fill="#696969" />
            <path class="outline" fill="#1E90FF" d="M 190 295 h 20 v 20 h 20 v 20 h -20 v 20 h -20 v -20 h -20 v -20 h 20 Z" />
            <path class="highlight" d="M 195 300 h 10 v 20 h 20 v 10 h -20 v 20 h -10 v -20 h -20 v -10 h 20 Z" />
            
            <!-- Top surface (angled) -->
            <path class="outline" fill="#F8F8FF" d="M 100 100 L 300 100 L 330 200 L 70 200 Z" />
            <!-- Letter F -->
            <text x="170" y="170" font-family="sans-serif" font-size="64" font-weight="bold" fill="#696969">F</text>
            
            <!-- Side connection -->
            <path class="outline" fill="#D3D3D3" d="M 70 200 L 100 250 L 300 250 L 330 200 Z" />
            
            <path class="highlight" d="M 110 110 L 290 110 L 310 190 L 90 190 Z" />
        </g>
    )SVG";

    // 4. Sticky Note
    items["sticky_note.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Main sticky note -->
            <path class="outline" fill="#FFD700" d="M 120 120 L 380 100 L 400 360 L 150 400 Z" />
            <path class="highlight" d="M 130 130 L 370 110 L 380 340 L 160 380 Z" />
            
            <!-- Shadow to show peeling corner -->
            <path class="shadow" d="M 120 120 L 150 140 L 150 400 L 120 120 Z" />
            
            <!-- Peeling corner (bottom left) -->
            <path class="outline" fill="#FFEC8B" d="M 150 400 Q 180 350 250 380 Q 200 420 150 400 Z" />
            
            <!-- Scribbles / Text -->
            <text x="180" y="180" font-family="sans-serif" font-size="32" font-weight="bold" fill="#111" transform="rotate(-5 180 180)">TODO:</text>
            <path fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" d="M 180 220 L 320 210" />
            <path fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" d="M 180 260 L 300 255" />
            <path fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" d="M 180 300 L 330 295" />
            <circle cx="160" cy="215" r="4" fill="#111" />
            <circle cx="160" cy="255" r="4" fill="#111" />
            <circle cx="160" cy="295" r="4" fill="#111" />
        </g>
    )SVG";

    // 5. Empty Yerba Mate Can
    items["empty_yerba_mate_can.svg"] = R"SVG(
        <g transform="rotate(20 256 256)">
            <!-- Can Body (Crushed) -->
            <path class="outline" fill="#FFD700" d="M 160 120 L 340 120 Q 320 250 360 260 Q 320 400 340 400 L 160 400 Q 180 250 140 240 Q 180 150 160 120 Z" />
            <path class="highlight" d="M 180 130 Q 200 250 160 240 Q 200 400 180 390 L 320 390 Q 300 250 340 260 Q 300 130 320 130 Z" />
            
            <!-- Top / Bottom Rim -->
            <ellipse cx="250" cy="120" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            <ellipse cx="250" cy="400" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            
            <!-- Can Tab (Broken) -->
            <ellipse cx="230" cy="120" rx="15" ry="10" fill="#111" />
            
            <!-- Mate Branding -->
            <text x="210" y="220" font-family="sans-serif" font-size="40" font-weight="bold" fill="#006400" transform="rotate(-90 210 220)">GUAYAKI</text>
            <circle cx="280" cy="300" r="30" fill="#006400" />
            <path fill="#FFD700" d="M 280 280 Q 290 300 280 310 Q 270 300 280 280 Z" /> <!-- Leaf logo -->
            
            <!-- Crushed lines -->
            <path fill="none" stroke="#B8860B" stroke-width="6" d="M 160 240 L 250 250 L 360 260" />
            <path fill="none" stroke="#B8860B" stroke-width="4" d="M 200 220 L 220 260" />
            <path fill="none" stroke="#B8860B" stroke-width="4" d="M 300 230 L 280 270" />
        </g>
    )SVG";

    // 6. Energy Drink Can
    items["energy_drink_can.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Can Body (Crushed in the middle) -->
            <path class="outline" fill="#1A1A1A" d="M 180 100 L 320 100 Q 360 250 260 260 Q 340 400 320 420 L 180 420 Q 200 280 140 260 Q 160 150 180 100 Z" />
            <path class="highlight" d="M 200 110 Q 220 250 160 260 Q 220 380 200 410 L 300 410 Q 320 250 260 260 Q 320 150 300 110 Z" />
            
            <!-- Rims -->
            <ellipse cx="250" cy="100" rx="70" ry="12" class="outline" fill="#C0C0C0" />
            <ellipse cx="250" cy="420" rx="70" ry="12" class="outline" fill="#C0C0C0" />
            
            <!-- Green Claw Marks -->
            <path fill="#32CD32" d="M 200 150 Q 210 200 200 230 Q 190 180 200 150 Z" />
            <path fill="#32CD32" d="M 230 140 Q 250 210 240 240 Q 220 190 230 140 Z" />
            <path fill="#32CD32" d="M 260 160 Q 280 210 270 230 Q 250 190 260 160 Z" />
            
            <path fill="none" stroke="#111" stroke-width="6" d="M 140 260 L 250 250 L 260 260" />
            <path class="shadow" d="M 180 420 Q 250 300 320 420 Z" />
        </g>
    )SVG";

    // 7. Empty Soylent Bottle
    items["empty_soylent_bottle.svg"] = R"SVG(
        <g transform="translate(0, 20)">
            <!-- Cap -->
            <rect x="220" y="80" width="60" height="30" rx="5" class="outline" fill="#111111" />
            <rect x="225" y="85" width="50" height="10" fill="#333333" />
            <rect x="210" y="110" width="80" height="10" rx="2" class="outline" fill="#111111" />
            
            <!-- Bottle Neck & Body -->
            <path class="outline" fill="#F5F5F5" d="M 210 120 L 290 120 Q 320 180 340 220 L 340 420 Q 340 450 310 450 L 190 450 Q 160 450 160 420 L 160 220 Q 180 180 210 120 Z" />
            <path class="highlight" d="M 230 130 L 270 130 Q 300 180 320 220 L 320 420 Q 320 430 310 430 L 190 430 Q 180 430 180 420 L 180 220 Q 200 180 230 130 Z" />
            
            <!-- Minimalist Branding (Black Text) -->
            <text x="250" y="300" font-family="sans-serif" font-size="28" font-weight="bold" fill="#111111" text-anchor="middle" transform="rotate(-90 250 300)">MEAL</text>
            <rect x="235" y="180" width="30" height="5" fill="#111111" />
            
            <path class="shadow" d="M 160 220 Q 250 250 340 220 L 340 420 Q 340 450 310 450 L 190 450 Q 160 450 160 420 Z" />
        </g>
    )SVG";

    // 8. VR Headset Strap
    items["vr_headset_strap.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Main Elastic Strap -->
            <path class="outline" fill="#1a1a1a" d="M 50 200 Q 250 100 450 200 L 450 260 Q 250 160 50 260 Z" />
            <path fill="#2F4F4F" d="M 60 215 Q 250 115 440 215 L 440 245 Q 250 145 60 245 Z" />
            
            <!-- Fabric / Elastic texture lines -->
            <path fill="none" stroke="#111111" stroke-width="4" stroke-dasharray="2 4" d="M 55 230 Q 250 130 445 230" />
            <path fill="none" stroke="#111111" stroke-width="4" stroke-dasharray="2 4" d="M 50 245 Q 250 145 445 245" />
            
            <!-- Plastic Buckle 1 -->
            <rect x="120" y="160" width="20" height="80" rx="5" class="outline" fill="#000000" transform="rotate(-20 130 200)" />
            <path class="highlight" d="M 125 165 L 135 165 L 135 230 L 125 230 Z" transform="rotate(-20 130 200)" />
            
            <!-- Plastic Buckle 2 (Broken End) -->
            <rect x="380" y="180" width="20" height="80" rx="5" class="outline" fill="#000000" transform="rotate(25 390 220)" />
            
            <!-- Velcro loop at the end -->
            <path class="outline" fill="#808080" d="M 450 200 Q 480 250 450 260 L 430 240 L 440 210 Z" />
        </g>
    )SVG";

    // 9. Broken USB Drive
    items["broken_usb_drive.svg"] = R"SVG(
        <g transform="rotate(-20 256 256)">
            <!-- Bent Silver Connector -->
            <path class="outline" fill="#C0C0C0" d="M 230 100 L 290 120 L 270 200 L 210 180 Z" />
            <path class="highlight" d="M 240 110 L 280 125 L 265 190 L 225 175 Z" />
            <!-- USB Holes -->
            <rect x="235" y="130" width="15" height="15" fill="#111111" transform="rotate(18 242 137)" />
            <rect x="260" y="138" width="15" height="15" fill="#111111" transform="rotate(18 267 145)" />
            
            <!-- Black Plastic Body (Angled differently to show it's broken) -->
            <path class="outline" fill="#111111" d="M 200 180 L 300 200 L 280 350 L 180 330 Z" />
            <path fill="#2F4F4F" d="M 210 190 L 290 205 L 275 340 L 195 320 Z" />
            
            <!-- Brand Logo -->
            <path class="outline" fill="none" stroke="#D3D3D3" stroke-width="4" d="M 230 250 L 260 255 M 245 230 L 245 270" />
            
            <!-- Cracked seam -->
            <path fill="none" stroke="#CD5C5C" stroke-width="4" d="M 205 185 L 230 210 L 250 195" />
            <circle cx="210" cy="180" r="4" fill="#111" />
        </g>
    )SVG";

    // 10. Protein Bar Wrapper
    items["protein_bar_wrapper.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Foil Wrapper Shape (Torn open) -->
            <path class="outline" fill="#8B4513" d="M 80 200 L 380 150 Q 400 200 380 250 L 80 300 Q 60 250 80 200 Z" />
            
            <!-- Inner silver foil -->
            <path fill="#C0C0C0" d="M 250 170 L 380 150 Q 400 200 380 250 L 250 270 Z" />
            <path fill="#D3D3D3" d="M 270 180 L 370 165 Q 380 200 370 235 L 270 250 Z" />
            
            <!-- Brand Colors -->
            <path fill="#FF4500" d="M 100 210 L 240 185 L 240 280 L 100 300 Z" />
            <text x="120" y="270" font-family="sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" transform="rotate(-8 120 270)">MAX-PRO</text>
            
            <!-- Torn edges (zigzag) -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 380 150 L 370 170 L 390 190 L 360 210 L 380 230 L 380 250" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 80 200 L 70 220 L 90 240 L 60 260 L 80 280 L 80 300" />
            
            <!-- Chocolate Crumbs -->
            <circle cx="350" cy="300" r="8" fill="#5C4033" />
            <circle cx="390" cy="270" r="5" fill="#5C4033" />
            <circle cx="420" cy="240" r="6" fill="#5C4033" />
            <circle cx="320" cy="320" r="4" fill="#5C4033" />
            
            <!-- Crinkle Highlights -->
            <path fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" d="M 150 210 Q 170 250 160 280" opacity="0.4" />
            <path fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" d="M 200 200 Q 220 240 210 270" opacity="0.4" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Tech Startup SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
