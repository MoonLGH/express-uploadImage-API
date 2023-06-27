const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer to store uploaded files in a temporary directory
const tempDir = path.join(__dirname, 'temp');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = uuidv4();
    cb(null, uniqueFilename);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Set up routes
app.use(express.json({ limit: '10mb' }));

// Serve files from the 'file' directory
app.use('/file', express.static(path.join(__dirname, 'file')));

// Handle POST requests to /upload
app.post('/upload', upload.single('image'), (req, res) => {
  const { file } = req;

  // If no file is provided in the request
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  // Generate a unique ID for the image
  const id = uuidv4();

  // Move the temporary file to the appropriate location
  const targetDir = path.join(__dirname, 'file');
  const targetPath = path.join(targetDir, `${id}.png`);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.renameSync(file.path, targetPath);

  // Set a timer to delete the file in 30 minutes
  setTimeout(() => {
    fs.unlink(targetPath, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Deleted file ${targetPath}`);
      }
    });
  }, 30 * 60 * 1000);

  // Return the ID to the client
  res.json({ id });
});

// Handle GET requests to /get/:id
app.get('/get/:id', (req, res) => {
  const { id } = req.params;
  const filename = `${id}.png`;
  const filePath = path.join(__dirname, 'file', filename);

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(err);
      res.status(404).json({ error: 'Image not found' });
    } else {
      // Return the file as a response
      res.sendFile(filePath);
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
