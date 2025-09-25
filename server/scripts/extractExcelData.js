const XLSX = require('xlsx');
const path = require('path');

// Read the Excel file
const excelFilePath = path.join(__dirname, '..', '..', 'SubscriptionUseCase_Dataset.xlsx');

try {
  console.log('Reading Excel file:', excelFilePath);
  
  // Read the workbook
  const workbook = XLSX.readFile(excelFilePath);
  
  // Get all sheet names
  const sheetNames = workbook.SheetNames;
  console.log('Available sheets:', sheetNames);
  
  // Extract data from each sheet
  const extractedData = {};
  
  sheetNames.forEach(sheetName => {
    console.log(`\n--- Processing sheet: ${sheetName} ---`);
    
    // Convert sheet to JSON
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Store the data
    extractedData[sheetName] = jsonData;
    
    // Display first few rows
    console.log('First 5 rows:');
    jsonData.slice(0, 5).forEach((row, index) => {
      console.log(`Row ${index}:`, row);
    });
    
    console.log(`Total rows: ${jsonData.length}`);
  });
  
  // Save extracted data to JSON file for reference
  const fs = require('fs');
  const outputPath = path.join(__dirname, 'extracted-dataset.json');
  fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2));
  console.log(`\nExtracted data saved to: ${outputPath}`);
  
} catch (error) {
  console.error('Error reading Excel file:', error);
  console.log('Make sure xlsx package is installed: npm install xlsx');
}