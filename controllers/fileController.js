const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const csvParser = require('csv-parser');
const { Parser } = require('json2csv');
const multer = require('multer');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', { recursive: true });
    }
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Use a unique file name with timestamp
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }).single('file');

// Handle file uploads
exports.uploadFile = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).send(`Error uploading file: ${err.message}`);
    }

    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    const ext = path.extname(file.originalname).toLowerCase();

    if (ext === '.csv') {
      const results = [];
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          // Clean up the uploaded file
          fs.unlink(file.path, (err) => {
            if (err) console.error(`Failed to delete file: ${file.path}`);
          });

          res.json({
            message: 'CSV file uploaded and processed successfully',
            data: results,
          });
        });
    } else if (ext === '.xls' || ext === '.xlsx') {
      const workbook = XLSX.readFile(file.path);
      const sheetNameList = workbook.SheetNames;
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
      
      // Clean up the uploaded file
      fs.unlink(file.path, (err) => {
        if (err) console.error(`Failed to delete file: ${file.path}`);
      });

      res.json({
        message: 'Excel file uploaded and processed successfully',
        data: sheetData,
      });
    } else {
      res.status(400).send('Invalid file format. Only CSV and Excel files are supported.');
    }
  });
};

// Handle file export
// Handle file export

exports.exportData = (req, res) => {
    const { data, format } = req.body;
    if (!data || !format) {
      return res.status(400).send('Data and format are required.');
    }
  
    const exportsDir = path.join(__dirname, '../exports');
    
    // Ensure the exports directory exists
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
  
    if (format === 'csv') {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(data);
      const filename = `export-${Date.now()}.csv`;
      const filePath = path.join(exportsDir, filename);
      fs.writeFileSync(filePath, csv);
  
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error(`Error while sending file: ${err}`);
          res.status(500).send('Failed to download file.');
        }
  
        // Clean up the file after download
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Failed to delete file: ${filePath}`);
        });
      });
    } else if (format === 'xls' || format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const filename = `export-${Date.now()}.${format}`;
      const filePath = path.join(exportsDir, filename);
      XLSX.writeFile(wb, filePath);
  
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error(`Error while sending file: ${err}`);
          res.status(500).send('Failed to download file.');
        }
  
        // Clean up the file after download
        fs.unlink(filePath, (err) => {
          if (err) console.error(`Failed to delete file: ${filePath}`);
        });
      });
    } else {
      res.status(400).send('Invalid format. Only CSV and Excel formats are supported.');
    }
  };