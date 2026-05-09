-- ============================================================
--  PSquare Art Gallery — Database Schema
--  Import this file in phpMyAdmin:
--  Database > Import > Choose File > psquare_db.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS psquare_db;
USE psquare_db;

-- ────────────────────────────────────────────────────────────
-- TABLE 1: artworks
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artworks (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)  NOT NULL,
    artist      VARCHAR(255)  NOT NULL,
    year        VARCHAR(20),
    medium      VARCHAR(255),
    origin      VARCHAR(100),
    category    VARCHAR(100),
    description TEXT,
    image_path  VARCHAR(255),
    price       INT DEFAULT 299,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO artworks (title, artist, year, medium, origin, category, description, image_path, price) VALUES
('Mona Lisa',
 'Leonardo da Vinci',
 '1503',
 'Oil on poplar panel',
 'Italy',
 'Renaissance',
 'The Mona Lisa is arguably the most famous painting in the world, celebrated for its subject''s enigmatic smile and Leonardo''s mastery of sfumato — a technique that softly blends edges to create atmospheric depth. It hangs today in the Louvre Museum, Paris.',
 'images/paintings/mona.jpg',
 499),

('Starry Night',
 'Vincent van Gogh',
 '1889',
 'Oil on canvas',
 'Netherlands',
 'Post-Impressionism',
 'A masterpiece by Vincent van Gogh, depicting a swirling night sky over Saint-Rémy-de-Provence. Painted while Van Gogh was at the Saint-Paul-de-Mausole asylum, it captures raw emotion through bold brushstrokes and vivid colour. Now at MoMA, New York.',
 'images/paintings/starry.jpg',
 449),

('Girl with a Pearl Earring',
 'Johannes Vermeer',
 '1665',
 'Oil on canvas',
 'Netherlands',
 'Dutch Golden Age',
 'Often called the "Mona Lisa of the North," Vermeer''s masterpiece features a girl gazing over her shoulder at the viewer, wearing a simple blue-and-yellow headscarf and a large pearl earring. Housed at the Mauritshuis gallery in The Hague.',
 'images/paintings/girl.jpg',
 399),

('Chhatrapati Shivaji Maharaj',
 'Traditional Indian Artist',
 '17th Century',
 'Traditional Painting',
 'India',
 'Historical Portrait',
 'Founder of the Maratha Empire, Chhatrapati Shivaji Maharaj is revered for his extraordinary leadership, military strategy, and vision of Swarajya (self-rule). His governance blended progressive secular and equal rights policies with military brilliance.',
 'images/paintings/maharaj.jpg',
 299),

('Water Lilies',
 'Claude Monet',
 '1906',
 'Oil on canvas',
 'France',
 'Impressionism',
 'Part of Monet''s celebrated series of approximately 250 oil paintings depicting the water lily pond at his garden in Giverny. The series is considered a breakthrough in modern art, emphasizing colour and light over form and line.',
 'images/paintings/monet.jpg',
 499),

('The Birth of Venus',
 'Sandro Botticelli',
 '1484–1486',
 'Tempera on canvas',
 'Italy',
 'Renaissance',
 'One of the most celebrated masterpieces of the Italian Renaissance, depicting the goddess Venus emerging from the sea as a fully grown woman. It is housed in the Uffizi Gallery in Florence, Italy.',
 'images/paintings/venus.jpg',
 449),

('The Last Supper',
 'Leonardo da Vinci',
 '1495–1498',
 'Tempera on gypsum',
 'Italy',
 'Renaissance',
 'A late 15th-century mural painting depicting the scene described in the Gospel of John 13:21, when Jesus Christ announced that one of his twelve apostles would betray him. Located in the refectory of the Convent of Santa Maria delle Grazie, Milan.',
 'images/paintings/lastsupper.jpg',
 399),

('The Persistence of Memory',
 'Salvador Dalí',
 '1931',
 'Oil on canvas',
 'Spain',
 'Surrealism',
 'One of the most recognizable works of Surrealism, depicting melting watches draped over a barren landscape. Dalí described it as a Surrealist vision of the softness of time. It is housed at the Museum of Modern Art, New York.',
 'images/paintings/dali.jpg',
 349);


-- ────────────────────────────────────────────────────────────
-- TABLE 2: ticket_bookings
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_bookings (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT DEFAULT NULL,
    ticket_id     VARCHAR(50) NOT NULL UNIQUE,
    visitor_name  VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    visit_date    DATE NOT NULL,
    adult_qty     INT DEFAULT 0,
    student_qty   INT DEFAULT 0,
    child_qty     INT DEFAULT 0,
    senior_qty    INT DEFAULT 0,
    total_amount  INT NOT NULL,
    booked_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- ────────────────────────────────────────────────────────────
-- TABLE 3: enquiries (Contact Form)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    subject    VARCHAR(255),
    message    TEXT NOT NULL,
    sent_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ────────────────────────────────────────────────────────────
-- TABLE 4: users (Login & Registration)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('visitor','admin') DEFAULT 'visitor',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
