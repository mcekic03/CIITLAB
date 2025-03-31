// Globalna obrada grešaka
const errorHandler = (err, req, res, next) => {
    // Logovanje greške u konzolu
    console.error('Global error handler:', err);
    console.error('Error stack:', err.stack);
  
    // Slanje odgovora klijentu
    res.status(500).json({
      message: 'Something went wrong!',
      error: err.message, // Šalje samo poruku greške
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Ako je development okruženje, šalje i stack trace
    });
  };
  
  module.exports = errorHandler;
  