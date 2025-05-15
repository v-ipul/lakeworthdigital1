# lakeworthdigital1


private String fetchExtractedText(String ocrDocumentScanResultId, String contentDocumentId) {
    Http http = new Http();
    HttpRequest request = new HttpRequest();

    // Salesforce REST API endpoint to fetch extracted text using the OCR result ID
    String endpointUrl = '/services/data/v58.0/actions/standard/fetchExtractedText';

    // Prepare the request body as a JSON string
    String requestBody = JSON.serialize(new Map<String, Object>{
        'inputs' => new List<Map<String, Object>>{
            new Map<String, Object>{
                'ocrDocumentScanResultId' => ocrDocumentScanResultId,  // OCR result ID obtained from the first step
                'contentDocumentId' => contentDocumentId,  // Ensure you pass the contentDocumentId as well
                'startPageIndex' => 1,  // Start from page 1
                'endPageIndex' => 20   // You can change the number of pages to extract
            }
        }
    });

    // Set up the HTTP request
    request.setEndpoint(URL.getOrgDomainUrl().toExternalForm() + endpointUrl);  // Combine Salesforce base URL with the endpoint
    request.setMethod('POST');
    request.setHeader('Content-Type', 'application/json');
    request.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());  // Use the session ID for authorization
    request.setBody(requestBody);

    // Send the HTTP request
    HttpResponse response = http.send(request);

    // Log the response for debugging
    System.debug('Extracted Text API response: ' + response.getBody());

    // Handle the response
    if (response.getStatusCode() == 200) {
        // Deserialize the response body into a List<Object> (as per your requirement)
        List<Object> responseList = (List<Object>) JSON.deserializeUntyped(response.getBody());

        // Check if the response list is not empty
        if (responseList != null && !responseList.isEmpty()) {
            // Get the first item in the response list
            Map<String, Object> firstResult = (Map<String, Object>) responseList.get(0);

            // Check if 'outputValues' key exists and contains 'ocrDocumentScanResultDetails'
            if (firstResult.containsKey('outputValues')) {
                Map<String, Object> outputValues = (Map<String, Object>) firstResult.get('outputValues');
                if (outputValues.containsKey('ocrDocumentScanResultDetails')) {
                    Map<String, Object> detailsMap = (Map<String, Object>) outputValues.get('ocrDocumentScanResultDetails');

                    // Check the status
                    String status = (String) detailsMap.get('status');
                    if (status != null && status == 'OCR_ENQUEUE') {
                        // If the status is still 'OCR_ENQUEUE', wait and retry
                        System.debug('OCR is still processing, retrying...');
                        // Wait for 5 seconds before retrying
                        // You can adjust the delay as per your requirements
                        try {
                            // Adding a sleep time to wait before polling again (5 seconds)
                            System.sleep(5000);
                        } catch (Exception e) {
                            System.debug('Exception in sleep: ' + e.getMessage());
                        }
                        // Retry the request recursively
                        return fetchExtractedText(ocrDocumentScanResultId, contentDocumentId);
                    } else if (status != null && status == 'SUCCESS') {
                        // Proceed when status is SUCCESS
                        System.debug('OCR processing is successful');
                        return detailsMap.toString(); // Return the extracted text (you can further process it if needed)
                    } else {
                        System.debug('Unexpected status: ' + status);
                    }
                }
            }
        }
        System.debug('No OCR document scan result details found.');
        return null;
    } else {
        System.debug('Error calling Extracted Text API, status: ' + response.getStatus() + ', body: ' + response.getBody());
        return null;
    }
}

