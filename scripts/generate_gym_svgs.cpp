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

    // 1. Protein Shake Bottle
    items["protein_shake_bottle.svg"] = R"SVG(
        <g transform="translate(0, 10)">
            <!-- Bottle Body -->
            <path class="outline" fill="#4682B4" d="M 180 150 L 340 150 L 320 420 Q 320 450 260 450 Q 200 450 200 420 Z" opacity="0.9" />
            <path class="highlight" d="M 190 160 L 230 160 L 220 420 Q 220 440 260 440 L 210 440 Q 210 440 210 420 Z" />
            
            <!-- Shaker Ball (inside) -->
            <circle cx="260" cy="350" r="25" fill="none" stroke="#C0C0C0" stroke-width="4" opacity="0.8" />
            <path fill="none" stroke="#C0C0C0" stroke-width="3" d="M 235 350 Q 260 325 285 350 M 235 350 Q 260 375 285 350 M 260 325 L 260 375" opacity="0.8" />
            
            <!-- Measuring lines -->
            <path fill="none" stroke="#FFFFFF" stroke-width="3" d="M 300 200 L 320 200 M 300 250 L 320 250 M 300 300 L 320 300 M 300 350 L 320 350 M 300 400 L 320 400" />
            
            <!-- Cap/Lid -->
            <path class="outline" fill="#111111" d="M 160 120 L 360 120 L 340 150 L 180 150 Z" />
            <path class="highlight" d="M 170 125 L 250 125 L 250 145 L 185 145 Z" />
            
            <!-- Flip Top -->
            <path class="outline" fill="#FF4500" d="M 220 90 L 260 90 A 20 20 0 0 1 260 120 L 220 120 Z" />
            <path class="outline" fill="#111" stroke-width="6" d="M 220 90 L 220 120" />
        </g>
    )SVG";

    // 2. Sweat Towel
    items["sweat_towel.svg"] = R"SVG(
        <g transform="rotate(-10 256 256)">
            <!-- Crumpled Towel Body -->
            <path class="outline" fill="#F8F8FF" d="M 150 150 Q 200 100 280 120 Q 380 140 400 250 Q 420 380 320 400 Q 220 420 120 350 Q 80 250 150 150 Z" />
            <path fill="#E6E6FA" d="M 160 160 Q 200 120 270 135 Q 360 150 380 250 Q 400 360 310 380 Q 220 400 130 340 Q 100 250 160 160 Z" />
            
            <!-- Blue stripes (Gym towel design) -->
            <path fill="none" stroke="#4169E1" stroke-width="12" stroke-linecap="round" d="M 160 200 Q 250 150 320 160" />
            <path fill="none" stroke="#4169E1" stroke-width="12" stroke-linecap="round" d="M 140 280 Q 200 260 260 350" />
            <path fill="none" stroke="#4169E1" stroke-width="12" stroke-linecap="round" d="M 360 220 Q 350 280 310 370" />
            
            <!-- Folds and Creases -->
            <path fill="none" stroke="#D3D3D3" stroke-width="6" stroke-linecap="round" d="M 200 120 Q 220 200 150 250" />
            <path fill="none" stroke="#D3D3D3" stroke-width="6" stroke-linecap="round" d="M 280 150 Q 300 250 220 300" />
            <path fill="none" stroke="#D3D3D3" stroke-width="6" stroke-linecap="round" d="M 350 180 Q 300 250 320 350" />
            <path fill="none" stroke="#D3D3D3" stroke-width="6" stroke-linecap="round" d="M 130 300 Q 200 350 220 400" />
        </g>
    )SVG";

    // 3. Energy Bar Wrapper
    items["energy_bar_wrapper.svg"] = R"SVG(
        <g transform="rotate(20 256 256)">
            <!-- Wrapper Back -->
            <path class="outline" fill="#111111" d="M 80 200 L 400 160 Q 420 200 400 250 L 80 300 Q 60 250 80 200 Z" />
            
            <!-- Wrapper Inside (Silver) -->
            <path fill="#C0C0C0" d="M 200 185 L 400 160 Q 420 200 400 250 L 200 280 Z" />
            <path class="highlight" d="M 220 190 L 380 170 Q 400 200 380 240 L 220 265 Z" />
            
            <!-- Wrapper Front (Red/Orange) -->
            <path fill="#FF4500" d="M 85 205 L 200 185 L 200 280 L 85 295 Z" />
            
            <!-- Branding -->
            <text x="90" y="260" font-family="sans-serif" font-size="36" font-weight="bold" fill="#FFF" transform="rotate(-10 90 260)">CLIF</text>
            <path fill="none" stroke="#FFF" stroke-width="4" d="M 90 220 L 180 205" />
            
            <!-- Torn zigzag edges -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 400 160 L 390 180 L 410 200 L 380 220 L 410 240 L 400 250" />
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 80 200 L 70 220 L 90 240 L 60 260 L 90 280 L 80 300" />
            
            <!-- Crumbs -->
            <circle cx="280" cy="220" r="8" fill="#8B4513" />
            <circle cx="320" cy="260" r="6" fill="#8B4513" />
            <circle cx="360" cy="200" r="5" fill="#8B4513" />
            <circle cx="340" cy="240" r="7" fill="#8B4513" />
        </g>
    )SVG";

    // 4. Banana Peel
    items["banana_peel.svg"] = R"SVG(
        <g transform="translate(0, 30)">
            <!-- Top stem -->
            <path class="outline" fill="#6B8E23" d="M 240 80 L 260 80 L 270 120 L 230 120 Z" />
            <path fill="#556B2F" d="M 245 80 L 255 80 L 260 120 L 240 120 Z" />
            
            <!-- Peel section 1 (Left) -->
            <path class="outline" fill="#FFD700" d="M 230 120 Q 150 150 100 250 Q 80 350 150 400 Q 200 350 180 250 Q 190 150 240 130 Z" />
            <path fill="#FFFACD" d="M 180 250 Q 200 350 150 400 Q 180 350 170 250 Z" />
            
            <!-- Peel section 2 (Right) -->
            <path class="outline" fill="#FFD700" d="M 270 120 Q 350 150 400 250 Q 420 350 350 400 Q 300 350 320 250 Q 310 150 260 130 Z" />
            <path fill="#FFFACD" d="M 320 250 Q 300 350 350 400 Q 320 350 330 250 Z" />
            
            <!-- Peel section 3 (Center drooping down) -->
            <path class="outline" fill="#FFD700" d="M 240 130 Q 250 250 250 350 Q 250 450 200 450 Q 180 400 200 350 Q 220 250 260 130 Z" />
            
            <!-- Brown spots (Overripe details) -->
            <circle cx="150" cy="220" r="5" fill="#8B4513" />
            <circle cx="140" cy="280" r="8" fill="#8B4513" />
            <circle cx="350" cy="230" r="6" fill="#8B4513" />
            <circle cx="360" cy="300" r="4" fill="#8B4513" />
            <circle cx="230" cy="300" r="7" fill="#8B4513" />
            <circle cx="210" cy="400" r="5" fill="#8B4513" />
            <circle cx="280" cy="180" r="4" fill="#8B4513" />
            <path fill="#8B4513" d="M 120 300 L 130 310 L 115 320 Z" />
        </g>
    )SVG";

    // 5. Broken Jump Rope
    items["broken_jump_rope.svg"] = R"SVG(
        <g>
            <!-- Tangles and loose rope -->
            <path class="outline" fill="none" stroke="#1E90FF" stroke-width="12" d="M 120 180 Q 250 50 380 200 T 250 350 T 150 250 T 400 350" />
            <path fill="none" stroke="#00BFFF" stroke-width="6" d="M 120 180 Q 250 50 380 200 T 250 350 T 150 250 T 400 350" />
            
            <!-- Snapped end -->
            <path class="outline" fill="none" stroke="#1E90FF" stroke-width="12" d="M 400 350 L 450 320" />
            <!-- Little frayed threads -->
            <path fill="none" stroke="#A9A9A9" stroke-width="4" d="M 450 320 L 470 310 M 450 320 L 475 325 M 450 320 L 460 340" />
            
            <!-- Handle -->
            <g transform="translate(100, 150) rotate(-45)">
                <rect x="0" y="0" width="30" height="120" rx="10" class="outline" fill="#111111" />
                <rect x="5" y="10" width="10" height="100" fill="#333333" />
                <path class="outline" fill="#FF4500" d="M 0 80 L 30 80 L 30 110 A 10 10 0 0 1 0 110 Z" />
                <!-- Grip tape -->
                <path fill="none" stroke="#555" stroke-width="4" d="M 0 20 L 30 30 M 0 40 L 30 50 M 0 60 L 30 70" />
            </g>
        </g>
    )SVG";

    // 6. Sports Drink Can
    items["sports_drink_can.svg"] = R"SVG(
        <g transform="rotate(15 256 256)">
            <!-- Can Body (Crushed) -->
            <path class="outline" fill="#0000FF" d="M 160 120 L 340 120 Q 320 250 360 260 Q 320 400 340 400 L 160 400 Q 180 250 140 240 Q 180 150 160 120 Z" />
            <path class="highlight" d="M 180 130 Q 200 250 160 240 Q 200 400 180 390 L 320 390 Q 300 250 340 260 Q 300 130 320 130 Z" />
            
            <!-- Rims -->
            <ellipse cx="250" cy="120" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            <ellipse cx="250" cy="400" rx="90" ry="15" class="outline" fill="#C0C0C0" />
            
            <!-- Brand Logo (Red Lightning Bolt) -->
            <path fill="#FF0000" d="M 260 180 L 220 250 L 260 250 L 240 320 L 300 220 L 260 220 Z" />
            <path class="outline" fill="none" stroke="#FFD700" stroke-width="4" d="M 260 180 L 220 250 L 260 250 L 240 320 L 300 220 L 260 220 Z" />
            
            <!-- Crushed lines -->
            <path fill="none" stroke="#00008B" stroke-width="6" d="M 160 240 L 250 250 L 360 260" />
            <path fill="none" stroke="#00008B" stroke-width="4" d="M 200 220 L 220 260" />
            <path fill="none" stroke="#00008B" stroke-width="4" d="M 300 230 L 280 270" />
        </g>
    )SVG";

    // 7. Yoga Mat Piece
    items["yoga_mat_piece.svg"] = R"SVG(
        <g transform="rotate(-15 256 256)">
            <!-- Main Mat Piece -->
            <path class="outline" fill="#9370DB" d="M 150 150 L 350 100 Q 400 200 350 300 L 200 400 Q 100 300 150 150 Z" />
            <path class="highlight" d="M 170 160 L 330 120 Q 370 200 330 280 L 210 370 Q 130 280 170 160 Z" />
            
            <!-- Torn edges -->
            <path class="outline" fill="none" stroke-width="8" stroke-linejoin="miter" d="M 150 150 L 160 130 L 180 140 L 190 110 L 210 120 L 230 90 L 250 110 L 270 80 L 300 110 L 320 80 L 350 100" />
            
            <!-- Texture Pattern (Tiny plus signs / dimples) -->
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 180 200 h 6 M 183 197 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 220 180 h 6 M 223 177 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 260 220 h 6 M 263 217 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 200 250 h 6 M 203 247 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 300 160 h 6 M 303 157 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 320 240 h 6 M 323 237 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 240 280 h 6 M 243 277 v 6" />
            <path fill="none" stroke="#8A2BE2" stroke-width="3" d="M 280 300 h 6 M 283 297 v 6" />
            
            <!-- Depth edge -->
            <path class="shadow" d="M 200 400 L 220 420 Q 320 320 370 300 L 350 300 Q 300 320 200 400 Z" />
        </g>
    )SVG";

    // 8. Shoe Box
    items["shoe_box.svg"] = R"SVG(
        <g transform="rotate(10 256 256)">
            <!-- Box Inside (Brown) -->
            <path fill="#8B4513" d="M 150 180 L 380 120 L 420 320 L 190 380 Z" />
            
            <!-- Box Back Wall -->
            <path class="outline" fill="#D2691E" d="M 150 180 L 380 120 L 380 80 L 150 140 Z" />
            
            <!-- Tissue Paper inside -->
            <path class="outline" fill="#F8F8FF" d="M 180 200 Q 250 100 350 180 Q 400 250 380 300 Q 300 250 200 350 Z" />
            <path class="highlight" d="M 200 210 Q 250 150 330 200 Q 350 250 340 280 Q 280 250 210 310 Z" />
            <path fill="none" stroke="#D3D3D3" stroke-width="4" d="M 250 180 Q 280 200 250 250 M 320 220 Q 350 250 300 300" />
            
            <!-- Box Front/Side Walls (Orange) -->
            <path class="outline" fill="#FF4500" d="M 150 140 L 150 180 L 190 380 L 190 340 Z" />
            <path class="outline" fill="#FF4500" d="M 190 380 L 420 320 L 420 280 L 190 340 Z" />
            
            <!-- Box Lid (Crushed, disconnected) -->
            <g transform="translate(-50, 80) rotate(-20)">
                <path class="outline" fill="#FF4500" d="M 250 350 L 450 300 L 480 380 L 280 430 Z" />
                <path fill="none" stroke="#FFFFFF" stroke-width="8" d="M 300 380 L 430 340" />
                <circle cx="365" cy="360" r="20" fill="#FFFFFF" />
            </g>
        </g>
    )SVG";

    // 9. Sweaty Towel Scrap
    items["sweaty_towel_scrap.svg"] = R"SVG(
        <g transform="translate(20, -20)">
            <!-- Main Cloth Body -->
            <path class="outline" fill="#E6E6FA" d="M 200 150 Q 280 80 350 180 Q 420 250 380 350 Q 300 450 200 400 Q 100 350 150 250 Z" />
            
            <!-- Sweat / Grime Patches -->
            <path fill="#B0C4DE" opacity="0.6" d="M 220 180 Q 280 120 320 190 Q 350 250 280 280 Q 220 250 220 180 Z" />
            <path fill="#B0C4DE" opacity="0.6" d="M 180 300 Q 240 380 280 350 Q 320 320 250 280 Z" />
            
            <!-- Fabric Texture & Tears -->
            <path fill="none" stroke="#A9A9A9" stroke-width="6" stroke-dasharray="4 6" d="M 180 200 L 320 220 M 170 240 L 350 270 M 190 320 L 330 350 M 200 370 L 280 390" />
            
            <!-- Frayed edges -->
            <path class="outline" fill="none" stroke-width="6" stroke-linejoin="miter" d="M 150 250 L 130 240 M 160 230 L 140 210 M 170 210 L 160 190 M 180 180 L 170 160 M 350 180 L 370 160 M 360 200 L 380 190" />
        </g>
    )SVG";

    // 10. Empty Preworkout Tub
    items["empty_preworkout_tub.svg"] = R"SVG(
        <g transform="rotate(-5 256 256)">
            <!-- Tub Body (Black) -->
            <path class="outline" fill="#1A1A1A" d="M 160 200 L 360 200 L 340 400 A 80 20 0 0 1 180 400 Z" />
            <path class="highlight" d="M 180 210 L 240 210 L 230 390 L 195 390 Z" />
            
            <!-- Label (Neon Pink/Green) -->
            <path class="outline" fill="#FF1493" d="M 170 240 L 350 240 L 345 350 L 175 350 Z" />
            <text x="260" y="290" font-family="sans-serif" font-size="36" font-weight="bold" fill="#32CD32" text-anchor="middle">PUMP</text>
            <text x="260" y="320" font-family="sans-serif" font-size="20" font-weight="bold" fill="#FFF" text-anchor="middle">EXTREME</text>
            
            <!-- Tub Opening (Top Rim) -->
            <ellipse cx="260" cy="200" rx="100" ry="25" class="outline" fill="#333" />
            <ellipse cx="260" cy="205" rx="90" ry="15" fill="#111" />
            
            <!-- Spilled Powder (Neon Pink) -->
            <path class="outline" fill="#FF1493" d="M 120 420 Q 200 380 280 440 Q 200 480 120 420 Z" />
            <circle cx="100" cy="410" r="5" fill="#FF1493" />
            <circle cx="90" cy="430" r="3" fill="#FF1493" />
            <circle cx="300" cy="430" r="6" fill="#FF1493" />
            <circle cx="320" cy="450" r="4" fill="#FF1493" />
            
            <!-- The Scoop -->
            <path class="outline" fill="#32CD32" d="M 280 430 L 350 400 L 370 420 L 320 460 Z" />
            <ellipse cx="360" cy="410" rx="15" ry="10" fill="#228B22" transform="rotate(-30 360 410)" />
        </g>
    )SVG";

    std::cout << "Starting generation of HIGH DETAIL Fitness Center SVG trash items..." << std::endl;
    for (const auto& pair : items) {
        writeSVG(pair.first, pair.second);
    }
    std::cout << "All SVGs generated successfully!" << std::endl;

    return 0;
}
