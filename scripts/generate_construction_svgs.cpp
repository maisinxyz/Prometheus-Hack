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

    // 1. Clean Sawdust Pile
    items["clean_sawdust_pile.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Sawdust base shape -->
            <path class="outline" fill="#DEB887" d="M 50 400 Q 150 250 250 150 Q 350 250 450 400 Q 250 450 50 400 Z" />
            <path fill="#F5DEB3" d="M 70 390 Q 160 270 250 170 Q 340 270 430 390 Q 250 430 70 390 Z" />
            
            <!-- Wood chips & texture lines -->
            <path fill="none" stroke="#D2B48C" stroke-width="6" stroke-linecap="round" d="M 120 370 Q 150 350 180 370" />
            <path fill="none" stroke="#D2B48C" stroke-width="6" stroke-linecap="round" d="M 280 330 Q 310 310 340 330" />
            <path fill="none" stroke="#D2B48C" stroke-width="6" stroke-linecap="round" d="M 220 250 L 260 270" />
            <circle cx="200" cy="300" r="4" fill="#8B4513" />
            <circle cx="280" cy="220" r="4" fill="#8B4513" />
            <circle cx="350" cy="360" r="5" fill="#8B4513" />
            
            <path class="shadow" d="M 70 390 Q 160 300 250 170 L 250 410 Q 160 410 70 390 Z" />
        </g>
    )SVG";

    // 2. Broken Brick Piece
    items["broken_brick_piece.svg"] = R"SVG(
        <g transform="rotate(-10 256 256)">
            <!-- Main Brick body -->
            <path class="outline" fill="#B22222" d="M 100 200 L 300 150 L 400 220 L 400 350 L 250 380 L 80 300 Z" />
            <path class="highlight" d="M 100 200 L 300 150 L 400 220 L 200 270 Z" />
            <path class="shadow" d="M 200 270 L 400 220 L 400 350 L 250 380 L 200 270 Z" />
            
            <!-- Core Holes -->
            <ellipse cx="200" cy="200" rx="20" ry="10" transform="rotate(-15 200 200)" fill="#111111" />
            <ellipse cx="280" cy="210" rx="20" ry="10" transform="rotate(-15 280 210)" fill="#111111" />
            
            <!-- Broken jagged edges -->
            <path class="outline" fill="#CD5C5C" d="M 400 220 L 420 230 L 380 250 L 410 280 L 390 320 L 400 350 L 400 220 Z" />
            
            <!-- Brick Texture & Cracks -->
            <circle cx="150" cy="280" r="3" fill="#000" opacity="0.3" />
            <circle cx="180" cy="260" r="4" fill="#000" opacity="0.3" />
            <circle cx="300" cy="300" r="3" fill="#000" opacity="0.3" />
            <circle cx="340" cy="250" r="5" fill="#000" opacity="0.3" />
            
            <path fill="none" stroke="#800000" stroke-width="4" stroke-linecap="round" d="M 100 300 L 150 280 L 180 320" />
        </g>
    )SVG";

    // 3. Yellow Caution Tape
    items["yellow_caution_tape.svg"] = R"SVG(
        <g>
            <!-- Wavy twisted tape -->
            <path class="outline" fill="#FFD700" d="M 50 350 Q 150 150 250 250 T 450 150 L 450 200 Q 350 300 250 200 T 50 400 Z" />
            <path class="highlight" d="M 60 360 Q 150 180 250 230 T 430 160 L 430 180 Q 350 250 250 210 T 70 380 Z" />
            
            <!-- Black diagonal stripes & CAUTION text -->
            <g fill="#111111" opacity="0.85">
                <path d="M 90 280 L 120 240 L 140 260 L 110 300 Z" />
                <path d="M 160 210 L 190 180 L 210 200 L 180 230 Z" />
                <path d="M 320 210 L 350 190 L 360 210 L 330 230 Z" />
                <path d="M 400 170 L 420 155 L 430 175 L 410 190 Z" />
            </g>
            <text x="210" y="225" font-family="sans-serif" font-size="28" font-weight="bold" fill="#111111" transform="rotate(-15 210 225)">CAUTION</text>
            
            <path fill="none" class="outline" stroke="#FFD700" stroke-width="30" d="M 150 400 Q 250 500 350 350 T 450 400" />
            <text x="260" y="415" font-family="sans-serif" font-size="24" font-weight="bold" fill="#111111" transform="rotate(-20 260 415)">CAUTION</text>
        </g>
    )SVG";

    // 4. Cement Mix Bag
    items["cement_mix_bag.svg"] = R"SVG(
        <g transform="rotate(5 256 256)">
            <!-- Main Bag Body -->
            <path class="outline" fill="#D3D3D3" d="M 120 150 L 380 150 Q 400 250 390 400 L 130 400 Q 100 250 120 150 Z" />
            
            <!-- Top seal fold -->
            <path class="outline" fill="#C0C0C0" d="M 100 120 L 400 120 L 380 150 L 120 150 Z" />
            <path fill="none" stroke="#111111" stroke-width="4" stroke-dasharray="8 4" d="M 120 135 L 380 135" />
            
            <!-- Graphic / Label -->
            <path fill="#A9A9A9" d="M 160 200 L 340 200 L 340 350 L 160 350 Z" />
            <rect x="170" y="210" width="160" height="40" fill="#CD5C5C" />
            <text x="250" y="240" font-family="sans-serif" font-size="24" font-weight="bold" fill="#FFF" text-anchor="middle">QUIK-CEMENT</text>
            
            <!-- Torn corner (spilling cement) -->
            <path class="outline" fill="#111111" d="M 340 380 L 390 350 L 390 400 L 340 400 Z" />
            <path class="outline" fill="#A9A9A9" d="M 330 380 Q 420 400 450 450 Q 360 440 330 420 Z" />
            
            <path class="shadow" d="M 130 150 L 200 150 L 200 400 L 130 400 Z" />
            
            <circle cx="390" cy="420" r="3" fill="#808080" />
            <circle cx="410" cy="430" r="4" fill="#808080" />
            <circle cx="430" cy="440" r="2" fill="#808080" />
        </g>
    )SVG";

    // 5. Rusty Nail
    items["rusty_nail.svg"] = R"SVG(
        <g transform="rotate(45 256 256)">
            <!-- Bent Nail Body -->
            <path class="outline" fill="#A9A9A9" stroke-linecap="round" d="M 240 100 L 260 100 L 260 300 Q 250 350 280 400 L 270 410 Q 230 350 240 300 Z" />
            <path fill="#5C4033" d="M 245 100 L 255 100 L 255 300 Q 245 350 272 400 L 268 405 Q 235 350 245 300 Z" />
            
            <!-- Nail Head -->
            <ellipse cx="250" cy="100" rx="30" ry="10" class="outline" fill="#3E2723" />
            <ellipse cx="250" cy="98" rx="20" ry="5" fill="#CD853F" opacity="0.6" />
            
            <!-- Rust Scaling -->
            <path fill="#D2691E" opacity="0.8" d="M 240 150 L 260 150 L 260 180 L 240 180 Z" />
            <path fill="#D2691E" opacity="0.8" d="M 240 220 L 260 220 L 260 260 L 240 260 Z" />
            <circle cx="255" cy="320" r="5" fill="#FF4500" />
            
            <path class="highlight" d="M 245 110 L 245 280" stroke="#FFF" stroke-width="2" />
        </g>
    )SVG";

    // 6. Cracked Hard Hat
    items["cracked_hard_hat.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Hat brim -->
            <path class="outline" fill="#FF8C00" d="M 50 350 Q 250 450 450 350 L 470 370 Q 250 470 30 370 Z" />
            
            <!-- Hat Dome -->
            <path class="outline" fill="#FFA500" d="M 100 350 A 150 150 0 0 1 400 350 Z" />
            <path fill="#FFD700" d="M 120 345 A 130 130 0 0 1 380 345 Z" />
            
            <!-- Dome Ridge -->
            <path class="outline" fill="#FF8C00" d="M 230 200 L 270 200 L 280 350 L 220 350 Z" />
            <path class="highlight" d="M 240 210 L 260 210 L 265 345 L 235 345 Z" />
            
            <!-- Huge jagged crack -->
            <path class="outline" fill="none" stroke="#111" stroke-width="8" stroke-linejoin="miter" d="M 150 350 L 170 300 L 155 270 L 190 220" />
            <path fill="none" stroke="#111" stroke-width="4" stroke-linejoin="miter" d="M 170 300 L 190 320" />
            
            <!-- Scuff marks & dirt -->
            <path fill="none" stroke="#8B4513" stroke-width="6" stroke-linecap="round" d="M 300 250 L 350 280" />
            <path fill="none" stroke="#8B4513" stroke-width="6" stroke-linecap="round" d="M 330 230 L 370 240" />
            <circle cx="180" cy="240" r="10" fill="#333" opacity="0.3" />
            <circle cx="340" cy="300" r="15" fill="#333" opacity="0.3" />
            
            <path class="shadow" d="M 100 350 A 150 150 0 0 1 250 200 L 250 350 Z" />
        </g>
    )SVG";

    // 7. Wood Scrap
    items["wood_scrap.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- 2x4 body, snapped ends -->
            <path class="outline" fill="#DEB887" d="M 150 100 L 200 90 L 250 110 L 230 400 L 180 420 L 130 380 Z" />
            
            <!-- Depth / side view -->
            <path class="outline" fill="#CD853F" d="M 250 110 L 300 130 L 280 420 L 230 400 Z" />
            <path class="highlight" d="M 160 110 L 240 120 L 220 380 L 140 370 Z" />
            <path class="shadow" d="M 250 110 L 280 120 L 260 400 L 230 400 Z" />
            
            <!-- Wood grain lines -->
            <path fill="none" stroke="#8B4513" stroke-width="4" d="M 160 140 Q 180 200 170 280 T 150 360" />
            <path fill="none" stroke="#8B4513" stroke-width="4" d="M 190 120 Q 210 200 200 250 T 190 380" />
            <path fill="none" stroke="#8B4513" stroke-width="4" d="M 220 150 Q 240 220 220 300 T 210 390" />
            
            <!-- Nails sticking out -->
            <path class="outline" fill="none" stroke="#A9A9A9" stroke-width="8" stroke-linecap="round" d="M 260 180 L 320 160" />
            <circle cx="320" cy="160" r="5" fill="#3E2723" />
            
            <path class="outline" fill="none" stroke="#A9A9A9" stroke-width="8" stroke-linecap="round" d="M 250 300 L 310 290" />
            <circle cx="310" cy="290" r="5" fill="#3E2723" />
        </g>
    )SVG";

    // 8. Drywall Scrap (Rock)
    items["drywall_scrap.svg"] = R"SVG(
        <g transform="rotate(-5 256 256)">
            <!-- Irregular polygon -->
            <path class="outline" fill="#F8F8FF" d="M 150 150 L 350 120 L 420 250 L 380 400 L 180 380 L 100 280 Z" />
            <path class="shadow" d="M 150 150 L 250 135 L 250 390 L 180 380 L 100 280 Z" />
            
            <!-- Plaster core exposed -->
            <path class="outline" fill="#FFFFFF" d="M 180 180 L 320 160 L 360 250 L 320 340 L 200 320 L 140 250 Z" />
            
            <!-- Ripped paper surface (tan/grey) -->
            <path fill="#D3D3D3" d="M 200 200 L 300 180 L 330 250 L 250 300 Z" />
            <path class="outline" fill="none" stroke-dasharray="10 10" d="M 200 200 L 300 180 L 330 250 L 250 300 Z" />
            
            <!-- Crumbles / Dust -->
            <circle cx="120" cy="350" r="8" fill="#F8F8FF" />
            <circle cx="100" cy="380" r="5" fill="#F8F8FF" />
            <circle cx="430" cy="200" r="6" fill="#F8F8FF" />
            <circle cx="410" cy="170" r="4" fill="#F8F8FF" />
            
            <!-- Chalky texture lines -->
            <path fill="none" stroke="#E6E6FA" stroke-width="4" d="M 160 220 L 200 240 M 340 280 L 360 300" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Construction Site SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
