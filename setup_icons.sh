#!/bin/bash

# Simple script to create placeholder icons using Python PIL
# Run: python3 create_icons.py

cat > create_icons.py << 'PYTHON'
from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with purple gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient circle
    center = size // 2
    radius = size // 2 - 2
    
    # Purple gradient colors
    color = (102, 126, 234, 255)  # #667eea
    
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=color,
        outline=(118, 75, 162, 255)  # #764ba2
    )
    
    # Add "CL" text for larger icons
    if size >= 48:
        from PIL import ImageFont
        try:
            font_size = size // 3
            # Try to use a default font, fallback to default if not available
            font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # Draw "CL" text in white
        text = "CL"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        text_x = (size - text_width) // 2
        text_y = (size - text_height) // 2 - 2
        
        draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    return img

# Create icons
for size in [16, 48, 128]:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png')
    print(f'Created icon{size}.png')

print('✅ All icons created successfully!')
PYTHON

echo "Created create_icons.py script"
echo ""
echo "To generate icons, you have 3 options:"
echo ""
echo "1. Use Python PIL:"
echo "   pip install pillow"
echo "   python3 create_icons.py"
echo ""
echo "2. Use online icon generator:"
echo "   - Visit https://www.favicon-generator.org/"
echo "   - Upload any image"
echo "   - Download and rename to icon16.png, icon48.png, icon128.png"
echo ""
echo "3. Use simple colored squares (quick workaround):"
echo "   Run the commands below to create temporary colored squares:"
echo ""

# Create simple colored square icons using base64 encoded PNG
cat > icons/create_simple_icons.sh << 'BASH'
#!/bin/bash
# Creates simple purple square icons as placeholders

# 16x16 purple square (base64 encoded PNG)
echo "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPklEQVQ4T2NkoBAwUqifYdQAhtEwIBwGo2FA3TAYrQKGBn/xMBoGoyEwGoOjYUDdGBytAgYBf4yGwWgYEBcGACNXAwElqXXlAAAAAElFTkSuQmCC" | base64 -d > icon16.png

# 48x48 purple square
echo "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAaElEQVRoQ+2YwQkAIAwEL8XOLMkG7MyCrMySrM+SX3yIDwQhgZwf5bIREQARGf0ABhhggAEGGGCAAQYYYIABBhhggAEGGGCAAQYYYIABBhhggAEGGGCAAQYYYIABBhhggAEGGGCAAQb+MfAB8KkwMGQHDREAAAAASUVORK5CYII=" | base64 -d > icon48.png

# 128x128 purple square
echo "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAvklEQVR4Xu3BMQEAAADCoPVP7WkJiEBhwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwIABAwYMGDBgwMArAx+QkAGB6muZHgAAAABJRU5ErkJggg==" | base64 -d > icon128.png

echo "✅ Created simple placeholder icons"
BASH

chmod +x icons/create_simple_icons.sh
echo "   cd icons && bash create_simple_icons.sh && cd .."
