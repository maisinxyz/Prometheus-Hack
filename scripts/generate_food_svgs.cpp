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

    // 1. Paper Plate
    items["paper_plate.svg"] = R"SVG(
        <g transform="translate(0, 10)">
            <!-- Outer Rim -->
            <ellipse cx="256" cy="256" rx="200" ry="200" class="outline" fill="#F8F8FF" />
            <path class="shadow" d="M 256 66 A 190 190 0 1 0 446 256 A 190 190 0 0 0 256 66 Z M 256 446 A 190 190 0 1 1 446 256 A 190 190 0 0 1 256 446 Z" />
            
            <!-- Ridged Edge -->
            <circle cx="256" cy="256" r="170" fill="none" stroke="#E6E6FA" stroke-width="20" stroke-dasharray="10 5" />
            
            <!-- Inner Base -->
            <ellipse cx="256" cy="256" rx="140" ry="140" class="outline" fill="#FFFFFF" />
            
            <!-- Grease/Food Stains -->
            <ellipse cx="220" cy="230" rx="40" ry="30" fill="#FF8C00" opacity="0.3" transform="rotate(-15 220 230)" />
            <ellipse cx="280" cy="280" rx="30" ry="20" fill="#8B4513" opacity="0.2" transform="rotate(25 280 280)" />
            
            <!-- Crumpled bend -->
            <path class="outline" fill="none" stroke-width="4" d="M 56 256 Q 150 200 256 256" opacity="0.3" />
            
            <!-- Fold -->
            <path fill="none" stroke="#D3D3D3" stroke-width="6" d="M 80 180 L 120 160" />
            <path fill="none" stroke="#D3D3D3" stroke-width="6" d="M 400 350 L 440 330" />
        </g>
    )SVG";

    // 2. Plastic Fork
    items["plastic_fork.svg"] = R"SVG(
        <g transform="rotate(45 256 256)">
            <!-- Handle -->
            <path class="outline" fill="#FFFFFF" d="M 230 150 L 270 150 L 260 400 L 240 400 Z" />
            <path class="highlight" d="M 240 160 L 260 160 L 255 390 L 245 390 Z" />
            
            <!-- Handle Snapped End -->
            <path class="outline" fill="none" stroke-width="4" d="M 240 400 L 245 390 L 250 405 L 255 395 L 260 400" />
            
            <!-- Head / Prongs Base -->
            <path class="outline" fill="#FFFFFF" d="M 220 150 L 280 150 L 270 180 L 230 180 Z" />
            
            <!-- Prongs -->
            <path class="outline" fill="#FFFFFF" d="M 220 150 L 225 60 L 235 60 L 235 150 Z" />
            <!-- Missing prong -->
            <!-- <path class="outline" fill="#FFFFFF" d="M 240 150 L 245 60 L 255 60 L 255 150 Z" /> -->
            <path class="outline" fill="#FFFFFF" d="M 245 150 L 245 130 L 255 130 L 255 150 Z" /> <!-- Snapped prong stub -->
            <path class="outline" fill="#FFFFFF" d="M 265 150 L 265 60 L 275 60 L 280 150 Z" />
            
            <!-- Grease -->
            <circle cx="230" cy="100" r="5" fill="#FF8C00" opacity="0.6" />
            <circle cx="270" cy="120" r="4" fill="#FF8C00" opacity="0.6" />
        </g>
    )SVG";

    // 3. Coffee Cup
    items["coffee_cup.svg"] = R"SVG(
        <g>
            <!-- Cup Body -->
            <path class="outline" fill="#FFFFFF" d="M 160 120 L 340 120 L 300 400 L 200 400 Z" />
            
            <!-- Cardboard Sleeve -->
            <path class="outline" fill="#DEB887" d="M 175 220 L 325 220 L 310 320 L 190 320 Z" />
            <!-- Sleeve Corrugated Texture -->
            <path fill="none" stroke="#CD853F" stroke-width="4" d="M 185 220 L 200 320 M 205 220 L 220 320 M 225 220 L 240 320 M 245 220 L 260 320 M 265 220 L 280 320 M 285 220 L 300 320" opacity="0.5" />
            
            <!-- Coffee Stain -->
            <path fill="#8B4513" d="M 180 120 Q 200 150 170 180 Z" opacity="0.7" />
            <circle cx="260" cy="380" r="10" fill="#8B4513" opacity="0.6" />
            <circle cx="280" cy="360" r="5" fill="#8B4513" opacity="0.5" />
            
            <!-- Shadows & Highlights -->
            <path class="shadow" d="M 160 120 L 220 120 L 200 400 L 200 400 Z" opacity="0.3" />
            <path class="highlight" d="M 280 120 L 340 120 L 300 400 L 280 400 Z" />
            
            <!-- Crushed Side -->
            <path class="outline" fill="none" stroke-width="6" d="M 340 120 L 320 150 L 335 180 L 315 220" />
        </g>
    )SVG";

    // 4. Coffee Cup Lid
    items["coffee_cup_lid.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Main Lid Shape (White/Translucent) -->
            <ellipse cx="256" cy="256" rx="160" ry="140" class="outline" fill="#F8F8FF" />
            
            <!-- Inner Rings -->
            <ellipse cx="256" cy="256" rx="130" ry="110" class="outline" fill="none" stroke-width="4" opacity="0.5" />
            <ellipse cx="256" cy="256" rx="90" ry="70" class="outline" fill="none" stroke-width="4" opacity="0.5" />
            
            <!-- Sip Hole -->
            <path class="outline" fill="#111" d="M 236 126 L 276 126 L 266 146 L 246 146 Z" />
            
            <!-- Raised Sip Lip -->
            <path class="outline" fill="none" stroke-width="6" d="M 220 150 Q 256 100 292 150" />
            
            <!-- Coffee Stains on Lid -->
            <ellipse cx="256" cy="136" rx="30" ry="20" fill="#8B4513" opacity="0.5" />
            <circle cx="320" cy="200" r="8" fill="#8B4513" opacity="0.4" />
            <circle cx="180" cy="220" r="5" fill="#8B4513" opacity="0.4" />
            
            <!-- Bent Rim -->
            <path class="outline" fill="#FFFFFF" d="M 96 256 Q 100 280 130 270 Q 110 240 96 256 Z" />
        </g>
    )SVG";

    // 5. Napkin (Clean/Greasy)
    items["napkin_clean.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Crumpled Napkin -->
            <path class="outline" fill="#FFFFFF" d="M 150 150 Q 200 120 280 140 Q 380 150 400 250 Q 410 380 320 400 Q 220 420 120 350 Q 100 250 150 150 Z" />
            
            <!-- Dimpled Texture -->
            <path fill="none" stroke="#D3D3D3" stroke-width="2" stroke-dasharray="2 4" d="M 160 160 L 380 160 M 150 180 L 390 180 M 140 200 L 400 200 M 130 220 L 400 220 M 120 240 L 400 240" opacity="0.5" />
            
            <!-- Creases and Folds -->
            <path fill="none" stroke="#A9A9A9" stroke-width="4" stroke-linecap="round" d="M 200 140 Q 220 250 150 300" />
            <path fill="none" stroke="#A9A9A9" stroke-width="4" stroke-linecap="round" d="M 280 150 Q 300 250 220 350" />
            <path fill="none" stroke="#A9A9A9" stroke-width="4" stroke-linecap="round" d="M 350 180 Q 300 300 350 380" />
            
            <!-- Grease spots (Makes it double as greasy napkin) -->
            <ellipse cx="250" cy="280" rx="40" ry="30" fill="#F0E68C" opacity="0.6" transform="rotate(-15 250 280)" />
            <ellipse cx="320" cy="200" rx="25" ry="15" fill="#F0E68C" opacity="0.4" transform="rotate(35 320 200)" />
        </g>
    )SVG";

    // 6. Plastic Water Bottle
    items["plastic_water_bottle.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Cap -->
            <rect x="230" y="80" width="40" height="20" class="outline" fill="#1E90FF" />
            <rect x="230" y="100" width="40" height="10" class="outline" fill="#D3D3D3" />
            
            <!-- Bottle Body (Clear plastic with blue tint) -->
            <path class="outline" fill="#E0FFFF" d="M 220 110 L 280 110 Q 320 150 320 200 L 320 400 Q 320 430 280 430 L 220 430 Q 180 430 180 400 L 180 200 Q 180 150 220 110 Z" opacity="0.7" />
            
            <!-- Label -->
            <path class="outline" fill="#FFFFFF" d="M 180 250 L 320 250 L 320 310 L 180 310 Z" />
            <rect x="180" y="255" width="140" height="5" fill="#1E90FF" />
            <rect x="180" y="300" width="140" height="5" fill="#1E90FF" />
            <path fill="#1E90FF" d="M 230 280 L 250 260 L 270 280 L 260 280 L 260 300 L 240 300 L 240 280 Z" /> <!-- Arrow logo -->
            
            <!-- Crinkled Plastic (Crushed middle) -->
            <path fill="none" stroke="#ADD8E6" stroke-width="4" d="M 180 180 L 240 200 L 320 180" />
            <path fill="none" stroke="#ADD8E6" stroke-width="4" d="M 180 220 L 260 210 L 320 230" />
            <path class="outline" fill="none" stroke-width="4" d="M 180 200 L 200 210 L 180 220" />
            <path class="outline" fill="none" stroke-width="4" d="M 320 170 L 290 190 L 320 210" />
            
            <!-- Water inside -->
            <path fill="#87CEEB" d="M 185 350 L 315 350 L 315 400 Q 315 425 280 425 L 220 425 Q 185 425 185 400 Z" opacity="0.5" />
            
            <!-- Glare -->
            <path fill="#FFF" d="M 200 150 L 220 150 L 220 410 L 200 410 Z" opacity="0.6" />
        </g>
    )SVG";

    // 7. Aluminum Soda Can
    items["aluminum_soda_can.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Can Body (Crushed) -->
            <path class="outline" fill="#DC143C" d="M 160 120 L 340 120 Q 320 250 360 260 Q 320 400 340 400 L 160 400 Q 180 250 140 240 Q 180 150 160 120 Z" />
            <path class="highlight" d="M 180 130 Q 200 250 160 240 Q 200 400 180 390 L 320 390 Q 300 250 340 260 Q 300 130 320 130 Z" />
            
            <!-- Rims -->
            <ellipse cx="250" cy="120" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            <ellipse cx="250" cy="400" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            
            <!-- Brand Element (White swirl) -->
            <path fill="#FFFFFF" d="M 180 180 Q 250 150 320 200 Q 250 280 200 240 Z" />
            
            <!-- Crushed lines -->
            <path fill="none" stroke="#8B0000" stroke-width="6" d="M 160 240 L 250 250 L 360 260" />
            <path fill="none" stroke="#8B0000" stroke-width="4" d="M 200 220 L 220 260" />
            <path fill="none" stroke="#8B0000" stroke-width="4" d="M 300 230 L 280 270" />
            
            <!-- Dirt -->
            <circle cx="280" cy="350" r="10" fill="#111" opacity="0.3" />
            <circle cx="200" cy="380" r="5" fill="#111" opacity="0.3" />
        </g>
    )SVG";

    // 8. Paper Straw Wrapper
    items["paper_straw_wrapper.svg"] = R"SVG(
        <g transform="rotate(35 256 256)">
            <!-- Flat empty wrapper body -->
            <path class="outline" fill="#F8F8FF" d="M 120 240 L 380 240 L 380 270 L 120 270 Z" />
            <path class="shadow" d="M 120 255 L 380 255 L 380 270 L 120 270 Z" />
            
            <!-- Zig-zag ends -->
            <path class="outline" fill="none" stroke-width="4" stroke-linejoin="miter" d="M 120 240 L 115 245 L 120 250 L 115 255 L 120 260 L 115 265 L 120 270" />
            <path class="outline" fill="none" stroke-width="4" stroke-linejoin="miter" d="M 380 240 L 385 245 L 380 250 L 385 255 L 380 260 L 385 265 L 380 270" />
            
            <!-- Wavy crease (shows it's empty and crinkled) -->
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 150 245 Q 180 260 200 245 T 250 245 T 300 245 T 350 245" />
            
            <!-- Torn in half effect (Overlapping middle) -->
            <path class="outline" fill="#F8F8FF" d="M 230 230 L 250 280 L 280 280 L 270 230 Z" opacity="0.8" />
        </g>
    )SVG";

    // 9. Plastic Straw
    items["plastic_straw.svg"] = R"SVG(
        <g transform="rotate(-40 256 256)">
            <!-- Straw Body -->
            <path class="outline" fill="#FFFFFF" d="M 100 240 L 400 240 L 400 260 L 100 260 Z" />
            
            <!-- Red Stripes -->
            <path fill="#DC143C" d="M 110 240 L 130 240 L 120 260 L 100 260 Z" />
            <path fill="#DC143C" d="M 150 240 L 170 240 L 160 260 L 140 260 Z" />
            <path fill="#DC143C" d="M 190 240 L 210 240 L 200 260 L 180 260 Z" />
            <path fill="#DC143C" d="M 230 240 L 250 240 L 240 260 L 220 260 Z" />
            <path fill="#DC143C" d="M 310 240 L 330 240 L 320 260 L 300 260 Z" />
            <path fill="#DC143C" d="M 350 240 L 370 240 L 360 260 L 340 260 Z" />
            
            <!-- Bendy Part -->
            <rect x="260" y="240" width="30" height="20" fill="#FFFFFF" />
            <path class="outline" fill="none" stroke-width="4" d="M 265 240 L 265 260 M 270 240 L 270 260 M 275 240 L 275 260 M 280 240 L 280 260 M 285 240 L 285 260" />
            
            <!-- Bent and chewed end -->
            <path class="outline" fill="#FFFFFF" d="M 100 240 Q 80 230 85 250 Q 100 270 100 260 Z" />
            <path fill="none" stroke="#111" stroke-width="2" d="M 90 245 L 95 255" />
            
            <!-- Broken/Creased middle -->
            <path class="outline" fill="none" stroke-width="4" d="M 350 240 L 345 250 L 355 260" />
        </g>
    )SVG";

    // 10. Food Scraps
    items["food_scraps.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Blob of sauce/grease -->
            <path class="outline" fill="#8B4513" d="M 150 250 Q 200 150 300 200 Q 380 220 350 300 Q 300 380 200 350 Q 100 320 150 250 Z" opacity="0.8" />
            
            <!-- Half eaten hotdog chunk -->
            <path class="outline" fill="#CD5C5C" d="M 180 220 L 260 240 L 250 280 L 170 260 Z" />
            <path class="highlight" d="M 190 230 L 250 245 L 245 260 L 185 245 Z" />
            <path fill="none" stroke="#111" stroke-width="4" stroke-dasharray="6 4" d="M 255 245 Q 240 260 245 275" /> <!-- Bite mark -->
            
            <!-- Macaroni noodle -->
            <path class="outline" fill="#FFD700" d="M 280 200 Q 320 200 320 240 Q 320 260 300 260 Q 290 220 270 220 Z" />
            
            <!-- Lettuce piece -->
            <path class="outline" fill="#32CD32" d="M 120 280 Q 160 250 180 300 Q 200 350 150 340 Q 100 320 120 280 Z" />
            
            <!-- Fries -->
            <polygon class="outline" points="300,300 360,280 370,290 310,310" fill="#FFC107" />
            <polygon class="outline" points="280,320 340,340 330,350 270,330" fill="#FFC107" />
            <polygon class="outline" points="310,260 350,220 360,230 320,270" fill="#FFC107" />
        </g>
    )SVG";

    // 11. Apple Core
    items["apple_core.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Core Body (Yellowish white) -->
            <path class="outline" fill="#FFFACD" d="M 230 150 Q 200 250 230 350 L 270 350 Q 300 250 270 150 Z" />
            <path class="shadow" d="M 230 150 Q 220 250 240 350 L 270 350 Q 280 250 270 150 Z" />
            
            <!-- Seeds -->
            <ellipse cx="245" cy="230" rx="4" ry="10" fill="#3E2723" transform="rotate(-15 245 230)" />
            <ellipse cx="255" cy="270" rx="4" ry="10" fill="#3E2723" transform="rotate(15 255 270)" />
            
            <!-- Top remnant (Red Apple Skin) -->
            <path class="outline" fill="#DC143C" d="M 180 150 Q 250 120 320 150 Q 300 180 250 180 Q 200 180 180 150 Z" />
            <!-- Stem -->
            <path class="outline" fill="#5C4033" d="M 250 140 Q 260 100 280 80 Q 270 90 250 110" stroke-width="8" />
            
            <!-- Bottom remnant (Red Apple Skin) -->
            <path class="outline" fill="#DC143C" d="M 180 350 Q 250 380 320 350 Q 300 320 250 320 Q 200 320 180 350 Z" />
            <path fill="#3E2723" d="M 245 360 L 255 360 L 250 370 Z" />
            
            <!-- Bite Marks in the core -->
            <path fill="none" stroke="#D2B48C" stroke-width="4" stroke-dasharray="6 4" d="M 220 200 Q 240 220 220 250" />
            <path fill="none" stroke="#D2B48C" stroke-width="4" stroke-dasharray="6 4" d="M 280 220 Q 260 250 280 280" />
            
            <circle cx="250" cy="300" r="5" fill="#8B4513" opacity="0.4" /> <!-- Bruise -->
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Food & Drink SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
