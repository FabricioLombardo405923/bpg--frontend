const gameState = {
            gameId: null,
            currentSlide: 0,
            totalSlides: 0,
            gameData: null
        };

        const API_BASE = 'http://localhost:3000/api';

        async function initializeJuego() {
            gameState.gameId = sessionStorage.getItem('gameID');
            
            if (!gameState.gameId) {
                showError('No se especificó un juego para mostrar');
                return;
            }

            await loadGameData();
        }

        async function loadGameData() {
            showLoading(true);
            
            try {
                const response = await fetch(`${API_BASE}/games/${gameState.gameId}`);
                const result = await response.json();

                if (!result.success || !result.data) {
                    throw new Error('Error al cargar datos del juego');
                }

                gameState.gameData = result.data;
                renderGameDetails();
                showLoading(false);
            } catch (error) {
                console.error('Error loading game:', error);
                showError('No se pudo cargar la información del juego');
            }
        }

        function renderGameDetails() {
            const page = document.getElementById('gamePage');
            page.innerHTML = '';

            renderTitle();
            renderCarousel();
            renderPriceSection();
            renderDescription();
            renderFeatures();
            renderRequirements();
        }

        function renderTitle() {
            const template = document.getElementById('title-section-template');
            const section = template.content.cloneNode(true);
            const game = gameState.gameData;

            section.querySelector('.game-title').textContent = game.nombre;
            
            const metadata = section.querySelector('.game-metadata');
            
            if (game.fechaLanzamiento) {
                addMetadataItem(metadata, 'fas fa-calendar', game.fechaLanzamiento);
            }
            
            if (game.desarrollador?.length) {
                addMetadataItem(metadata, 'fas fa-code', game.desarrollador.join(', '));
            }
            
            if (game.publicador?.length) {
                addMetadataItem(metadata, 'fas fa-building', game.publicador.join(', '));
            }

            document.getElementById('gamePage').appendChild(section);
        }

        function addMetadataItem(container, iconClass, text) {
            const template = document.getElementById('metadata-item-template');
            const item = template.content.cloneNode(true);
            
            item.querySelector('i').className = iconClass;
            item.querySelector('span').textContent = text;
            
            container.appendChild(item);
        }

        function renderCarousel() {
            const template = document.getElementById('carousel-section-template');
            const section = template.content.cloneNode(true);
            const game = gameState.gameData;

            const track = section.querySelector('.carousel-track');
            const indicators = section.querySelector('.carousel-indicators');

            const media = [];

            // Add screenshots
            if (game.imagenes?.screenshotsSteam?.length) {
                game.imagenes.screenshotsSteam.forEach(screenshot => {
                    media.push({ type: 'image', url: screenshot.full });
                });
            } else if (game.imagenes?.screenshots?.length) {
                game.imagenes.screenshots.forEach(screenshot => {
                    media.push({ type: 'image', url: screenshot.fullHD });
                });
            }

            // Add videos
            if (game.videos?.length) {
                game.videos.forEach(video => {
                    media.push({ type: 'video', url: video.mp4, poster: video.thumbnail });
                });
            }

            gameState.totalSlides = media.length;

            media.forEach((item, index) => {
                if (item.type === 'image') {
                    const slideTemplate = document.getElementById('carousel-slide-template');
                    const slide = slideTemplate.content.cloneNode(true);
                    const img = slide.querySelector('img');
                    img.src = item.url;
                    img.alt = `${game.nombre} - Screenshot ${index + 1}`;
                    track.appendChild(slide);
                } else if (item.type === 'video') {
                    const videoTemplate = document.getElementById('carousel-video-template');
                    const slide = videoTemplate.content.cloneNode(true);
                    const video = slide.querySelector('video');
                    const source = video.querySelector('source');
                    source.src = item.url;
                    if (item.poster) video.poster = item.poster;
                    track.appendChild(slide);
                }

                const indicatorTemplate = document.getElementById('carousel-indicator-template');
                const indicator = indicatorTemplate.content.cloneNode(true);
                const btn = indicator.querySelector('.indicator');
                if (index === 0) btn.classList.add('active');
                btn.onclick = () => goToSlide(index);
                indicators.appendChild(indicator);
            });

            const prevBtn = section.querySelector('.carousel-btn.prev');
            const nextBtn = section.querySelector('.carousel-btn.next');
            prevBtn.onclick = () => changeSlide(-1);
            nextBtn.onclick = () => changeSlide(1);

            document.getElementById('gamePage').appendChild(section);
        }

        function changeSlide(direction) {
            gameState.currentSlide += direction;
            if (gameState.currentSlide < 0) gameState.currentSlide = gameState.totalSlides - 1;
            if (gameState.currentSlide >= gameState.totalSlides) gameState.currentSlide = 0;
            updateCarousel();
        }

        function goToSlide(index) {
            gameState.currentSlide = index;
            updateCarousel();
        }

        function updateCarousel() {
            const track = document.querySelector('.carousel-track');
            const indicators = document.querySelectorAll('.indicator');
            
            track.style.transform = `translateX(-${gameState.currentSlide * 100}%)`;
            
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === gameState.currentSlide);
            });
        }

        function renderPriceSection() {
            const game = gameState.gameData;
            
            if (!game.linksCompra?.length) return;

            const template = document.getElementById('price-section-template');
            const section = template.content.cloneNode(true);
            const container = section.querySelector('.purchase-options');

            game.linksCompra.forEach(link => {
                if (!link.esPrincipal) {
                    const cardTemplate = document.getElementById('purchase-card-template');
                    const card = cardTemplate.content.cloneNode(true);

                    card.querySelector('.store-name').textContent = link.tienda;
                    
                    if (link.precio !== null) {
                        card.querySelector('.current-price').textContent = `$${link.precio.toFixed(2)}`;
                    } else {
                        card.querySelector('.current-price').textContent = 'Ver precio';
                    }

                    if (game.precioNormal && link.precio < game.precioNormal) {
                        card.querySelector('.original-price').textContent = `$${game.precioNormal.toFixed(2)}`;
                        card.querySelector('.discount-badge').textContent = `-${Math.round(link.descuento)}%`;
                    } else {
                        card.querySelector('.original-price').remove();
                        card.querySelector('.discount-badge').remove();
                    }

                    card.querySelector('.btn-buy').href = link.url;

                    container.appendChild(card);
                }
            });

            document.getElementById('gamePage').appendChild(section);
        }

        function renderDescription() {
            const game = gameState.gameData;
            
            if (!game.descripcion) return;

            const template = document.getElementById('description-section-template');
            const section = template.content.cloneNode(true);
            
            section.querySelector('.description-content').innerHTML = game.descripcion;

            document.getElementById('gamePage').appendChild(section);
        }

        function renderFeatures() {
            const game = gameState.gameData;
            const template = document.getElementById('features-section-template');
            const section = template.content.cloneNode(true);
            const grid = section.querySelector('.feature-grid');

            // Genres
            if (game.generos?.length) {
                addFeatureGroup(grid, 'fas fa-gamepad', 'Géneros', game.generos);
            }

            // Categories
            if (game.categorias?.length) {
                addFeatureGroup(grid, 'fas fa-th-large', 'Categorías', game.categorias);
            }

            // Tags
            if (game.tags?.length) {
                addFeatureGroup(grid, 'fas fa-tags', 'Etiquetas', game.tags.slice(0, 15));
            }

            // Platforms
            if (game.plataformas?.length) {
                addFeatureGroup(grid, 'fas fa-desktop', 'Plataformas', game.plataformas);
            }

            // Languages
            if (game.idiomas?.length) {
                const languages = game.idiomas.map(l => l.idioma).filter(l => l !== '*');
                if (languages.length) {
                    addFeatureGroup(grid, 'fas fa-language', 'Idiomas', languages);
                }
            }

            document.getElementById('gamePage').appendChild(section);
        }

        function addFeatureGroup(container, icon, title, items) {
            const template = document.getElementById('feature-group-template');
            const group = template.content.cloneNode(true);
            
            const titleEl = group.querySelector('.feature-group-title');
            titleEl.innerHTML = `<i class="${icon}"></i> ${title}`;
            
            const badgeContainer = group.querySelector('.badge-container');
            
            items.forEach(item => {
                const badgeTemplate = document.getElementById('badge-template');
                const badge = badgeTemplate.content.cloneNode(true);
                badge.querySelector('.badge').textContent = item;
                badgeContainer.appendChild(badge);
            });

            container.appendChild(group);
        }

        function renderRequirements() {
            const game = gameState.gameData;
            
            if (!game.requisitosMinimos && !game.requisitosRecomendados) return;

            const template = document.getElementById('requirements-section-template');
            const section = template.content.cloneNode(true);

            const minContent = section.querySelector('.minimum .requirements-content');
            const recContent = section.querySelector('.recommended .requirements-content');

            if (game.requisitosMinimos) {
                parseRequirements(game.requisitosMinimos, minContent);
            } else {
                minContent.innerHTML = '<p style="color: #888;">No se especifica.</p>';
            }

            if (game.requisitosRecomendados) {
                parseRequirements(game.requisitosRecomendados, recContent);
            } else {
                recContent.innerHTML = '<p style="color: #888;">No se especifica.</p>';
            }

            document.getElementById('gamePage').appendChild(section);
        }

        function parseRequirements(htmlString, container) {
            const temp = document.createElement('div');
            temp.innerHTML = htmlString;

            const items = temp.querySelectorAll('li');
            
            items.forEach(item => {
                const text = item.textContent.trim();
                const parts = text.split(':');
                
                if (parts.length >= 2) {
                    const template = document.getElementById('requirement-item-template');
                    const reqItem = template.content.cloneNode(true);
                    
                    reqItem.querySelector('.req-label').textContent = parts[0].trim() + ':';
                    reqItem.querySelector('.req-value').textContent = parts.slice(1).join(':').trim();
                    
                    container.appendChild(reqItem);
                }
            });
        }

        function showLoading(show) {
            document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
            document.getElementById('errorState').style.display = 'none';
        }

        function showError(message) {
            document.getElementById('errorMessage').textContent = message;
            document.getElementById('errorState').style.display = 'flex';
            document.getElementById('loadingState').style.display = 'none';
        }

        // Initialize on load
        initializeJuego();