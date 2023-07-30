<script lang="ts">
    export let imageBytes: Uint8Array; // The Uint8Array containing the PNG image data
    const imageSource = createImageSource(imageBytes);
  
    function createImageSource(bytes: Uint8Array) {
      // Convert the Uint8Array to a Base64-encoded Data URL
      const base64String = btoa(String.fromCharCode(...bytes));
      const mimeType = 'image/png';
      return `data:${mimeType};base64,${base64String}`;
    }
  </script>
  
  <style>
    /* Add any custom styles for the image container */
    .image-container {
      max-width: 100%;
      max-height: 100%;
    }
  </style>
  
  <div class="image-container">
    <!-- Display the image using the data URL -->
    <img src="{imageSource}" alt="PNG Image" />
  </div>
  