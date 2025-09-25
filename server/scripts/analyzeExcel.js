const XLSX = require('xlsx');
const path = require('path');

// Read and analyze Excel file structure
const analyzeExcelStructure = () => {
  try {
    const excelPath = path.join(__dirname, '../../SubscriptionUseCase_Dataset.xlsx');
    console.log('📖 Analyzing Excel file structure from:', excelPath);
    
    const workbook = XLSX.readFile(excelPath);
    const worksheetNames = workbook.SheetNames;
    
    worksheetNames.forEach(sheetName => {
      console.log(`\n📋 Worksheet: "${sheetName}"`);
      console.log('=' .repeat(50));
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`Records: ${jsonData.length}`);
      
      if (jsonData.length > 0) {
        console.log('Columns:', Object.keys(jsonData[0]));
        console.log('Sample record:', jsonData[0]);
        
        if (jsonData.length > 1) {
          console.log('Second record:', jsonData[1]);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
  }
};

analyzeExcelStructure();