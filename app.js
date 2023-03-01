const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer to store uploaded files in memory for 10 minutes
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Set up routes
app.use(bodyParser.json({ limit: '10mb' }));

// Handle POST requests to /upload
app.post('/upload', upload.single('image'), (req, res) => {
    let { image } = req.body;

    // If image field is not provided in request body
    if (!image) {
        res.status(400).json({ error: 'No image data provided' });
        return;
    }

    if (image.type === "Buffer") {
        image = Buffer.from(image.data).toString('base64');
        console.log(image)
    }
    // Generate a unique ID for the image
    const id = Math.random().toString(36).substr(2, 9);

    // Write the image data to disk with a filename that includes the ID
    let imageData;
    let extension = 'png';
    // Parse base64 image data
    imageData = Buffer.from(image, 'base64');
    console.log(imageData)

    const filename = `./file/${id}.${extension}`;
    fs.writeFile(filename, imageData, (err) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Unable to save image' });
        } else {
            // Set a timer to delete the file in 10 minutes
            setTimeout(() => {
                fs.unlink(filename, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(`Deleted file ${filename}`);
                    }
                });
            }, 10 * 60 * 1000);
            // Return the ID to the client
            res.json({ id });
        }
    });
});

// Handle GET requests to /get/:id
app.get('/get/:id', (req, res) => {
    const { id } = req.params;
    const filename = `${id}.png`;
    const url = `/file/file/${filename}`;

    // Check if the file exists
    fs.access("./file/"+filename, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(err);
            res.status(404).json({ error: 'Image not found' });
        } else {
            // Return the URL to the client
            res.json({ url });
        }
    });
});

// Serve files from the file directory
app.use('/file', express.static(__dirname));

// Start the server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
