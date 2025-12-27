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
