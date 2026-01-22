#convertToPng.py

# To install:
# pip install Pillow pillow-avif-plugin

from PIL import Image
import pillow_avif  # This registers the AVIF plugin with Pillow

# Open the AVIF image
img = Image.open('input.avif')

# Save the image as PNG
img.save('output.png', 'PNG')

