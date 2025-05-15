# lakeworthdigital1


// Deserialize the response as a Map<String, Object>
Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(response.getBody());

// Check if 'ocrDocumentScanResultDetails' is present and handle the list inside it
if (responseMap.containsKey('ocrDocumentScanResultDetails')) {
    List<Map<String, Object>> ocrDetailsList = (List<Map<String, Object>>) responseMap.get('ocrDocumentScanResultDetails');
    
    // Process each item in the list
    for (Map<String, Object> ocrDetail : ocrDetailsList) {
        // Process the OCR details
        System.debug('OCR Detail: ' + ocrDetail);
    }
} else {
    System.debug('No OCR details found in the response.');
}
