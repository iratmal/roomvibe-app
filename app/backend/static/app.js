let uploadedImage = null;
let selectedArtwork = null;

const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const previewImage = document.getElementById('previewImage');
const uploadContent = uploadZone.querySelector('.upload-content');

uploadZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
    handleImageUpload(e.target.files[0]);
});

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    }
});

function handleImageUpload(file) {
    if (!file) return;
    
    uploadedImage = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        previewImage.style.display = 'block';
        uploadContent.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

document.getElementById('uploadArtworkBtn').addEventListener('click', async () => {
    if (!uploadedImage) {
        alert('Please upload an image first!');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', uploadedImage);
    
    try {
        const response = await fetch('/api/palette', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        displayPalette(data.colors, data.mood);
    } catch (error) {
        console.error('Error extracting palette:', error);
        alert('Error extracting color palette. Please try again.');
    }
});

function displayPalette(colors, mood) {
    const paletteContainer = document.getElementById('paletteContainer');
    const moodText = document.getElementById('moodText');
    const paletteSection = document.getElementById('paletteSection');
    
    paletteContainer.innerHTML = '';
    
    colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;
        swatch.innerHTML = `<span class="color-code">${color}</span>`;
        
        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(color);
            alert(`Color ${color} copied to clipboard!`);
        });
        
        paletteContainer.appendChild(swatch);
    });
    
    moodText.textContent = mood.replace('_', ' ');
    paletteSection.style.display = 'block';
    paletteSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('getSuggestionsBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/artworks');
        const artworks = await response.json();
        displayArtworks(artworks);
    } catch (error) {
        console.error('Error fetching artworks:', error);
        alert('Error loading artworks. Please try again.');
    }
});

function displayArtworks(artworks) {
    const artworksContainer = document.getElementById('artworksContainer');
    const artworksSection = document.getElementById('artworksSection');
    
    artworksContainer.innerHTML = '';
    
    artworks.forEach(artwork => {
        const card = document.createElement('div');
        card.className = 'artwork-card';
        card.dataset.id = artwork.id;
        card.dataset.url = artwork.product_url;
        card.dataset.title = artwork.title;
        
        card.innerHTML = `
            <img src="${artwork.image_url}" alt="${artwork.title}" class="artwork-image" 
                 onerror="this.style.background='linear-gradient(135deg, #667eea 0%, #764ba2 100%)'">
            <div class="artwork-info">
                <div class="artwork-title">${artwork.title}</div>
                <div class="artwork-details">
                    <span>Ratio: ${artwork.ratio}</span>
                    <span class="artwork-price">€${artwork.price_eur.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.artwork-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedArtwork = {
                id: artwork.id,
                title: artwork.title,
                url: artwork.product_url
            };
            showCheckoutSection();
        });
        
        artworksContainer.appendChild(card);
    });
    
    artworksSection.style.display = 'block';
    artworksSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showCheckoutSection() {
    const checkoutSection = document.getElementById('checkoutSection');
    const selectedArtworkText = document.getElementById('selectedArtwork');
    
    selectedArtworkText.textContent = selectedArtwork.title;
    checkoutSection.style.display = 'block';
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

document.getElementById('generateCheckoutBtn').addEventListener('click', async () => {
    if (!selectedArtwork) {
        alert('Please select an artwork first!');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('product_url', selectedArtwork.url);
        
        const response = await fetch('/api/checkout-link', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        displayCheckoutLink(data.checkout_url);
    } catch (error) {
        console.error('Error generating checkout link:', error);
        alert('Error generating checkout link. Please try again.');
    }
});

function displayCheckoutLink(url) {
    const linkContainer = document.getElementById('checkoutLinkContainer');
    const linkElement = document.getElementById('checkoutLink');
    
    linkElement.href = url;
    linkElement.textContent = url;
    linkContainer.style.display = 'block';
}

document.getElementById('useCatalogBtn').addEventListener('click', () => {
    alert('Catalog mode: Click "Get suggestions (catalog)" to view available artworks!');
});
