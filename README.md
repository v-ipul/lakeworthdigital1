# lakeworthdigital1


public class ProcessDocumentJob implements Queueable, Database.AllowsCallouts {
    private String contentDocumentId;
    private String recordId;
    private Integer retryCount;

    // Constructor to initialize the variables, including retry count for polling
    public ProcessDocumentJob(String contentDocumentId, String recordId, Integer retryCount) {
        this.contentDocumentId = contentDocumentId;
        this.recordId = recordId;
        this.retryCount = retryCount;
    }

    // Entry point for the queueable job, called to process the document
    public void execute(QueueableContext context) {
        // Retrieve the content of the uploaded file (PDF)
        ContentVersion cv = [SELECT Id, Title, VersionData FROM ContentVersion WHERE ContentDocumentId = :contentDocumentId LIMIT 1];
        if (cv == null) {
            System.debug('No ContentVersion found for ContentDocumentId: ' + contentDocumentId);
            return; // Exit if no record is found
        }

        // Trigger OCR processing using Intelligent Document Reader (IDR) - via HTTP callout
        String ocrResult = triggerOcrProcessing(cv.VersionData);

        if (String.isBlank(ocrResult)) {
            System.debug('OCR result was empty.');
            return;
        }

        // Insert new Profit_and_Loss__c record with extracted data
        insertNewProfitAndLossRecord(ocrResult);

        // If OCR result is still in progress (OCR_ENQUEUE), requeue the job to check again
        if (retryCount < 5) {  // Limit the number of retries to 5
            if (ocrResult == 'OCR_ENQUEUE') {
                System.debug('OCR is still processing. Retrying...');
                // Requeue the job with increased retry count
                System.enqueueJob(new ProcessDocumentJob(contentDocumentId, recordId, retryCount + 1));  // Requeue the job
            }
        }
    }

    // This method performs HTTP callout to the OCR API to trigger text extraction
    private String triggerOcrProcessing(Blob documentData) {
        Http http = new Http();
        HttpRequest request = new HttpRequest();

        // Salesforce REST API endpoint to initiate text extraction
        String endpointUrl = '/services/data/v58.0/actions/standard/initiateTextExtraction';

        // Prepare the request body as a JSON string
        String requestBody = JSON.serialize(new Map<String, Object>{
            'inputs' => new List<Map<String, Object>>{
                new Map<String, Object>{
                    'contentDocumentId' => contentDocumentId,  // Your uploaded document ID
                    'startPageIndex' => 1,  // Start from page 1
                    'endPageIndex' => 20,  // You can change this based on how many pages you want to extract
                    'ocrService' => 'AMAZON_TEXTRACT'  // Using the Textract OCR service
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

        // Log the response body for debugging
        System.debug('OCR API response: ' + response.getBody());

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
                        // Fetch status and check if it's "OCR_ENQUEUE"
                        Map<String, Object> detailsMap = (Map<String, Object>) outputValues.get('ocrDocumentScanResultDetails');
                        String status = (String) detailsMap.get('status');
                        if (status != null && status == 'OCR_ENQUEUE') {
                            return 'OCR_ENQUEUE';  // Return to indicate processing is still ongoing
                        } else if (status != null && status == 'SUCCESS') {
                            return detailsMap.toString();  // Return the extracted text if processing is complete
                        }
                    }
                }
            }
        } else {
            System.debug('Error calling OCR API: ' + response.getBody());
        }
        return null;
    }

    // This method inserts a new Profit and Loss record using the extracted OCR data
    private void insertNewProfitAndLossRecord(String ocrResult) {
        try {
            Profit_and_Loss__c newRecord = new Profit_and_Loss__c();

            // Parse the OCR JSON result dynamically into a Map<String,Object>
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(ocrResult);

            // Extract fields safely – customize keys based on your OCR JSON structure
            if (responseMap.containsKey('Company Name')) {
                newRecord.Name = (String) responseMap.get('Company Name');
            }

            if (responseMap.containsKey('Borrower Name')) {
                newRecord.Borrower_Name_s__c = (String) responseMap.get('Borrower Name');
            }
            if (responseMap.containsKey('Type of Business')) {
                newRecord.Type_of_Bussiness__c = (String) responseMap.get('Type of Business');
            }

            // Insert the new record
            insert newRecord;
            System.debug('Inserted Profit_and_Loss__c record with Id: ' + newRecord.Id);

        } catch (Exception ex) {
            System.debug('Failed to insert Profit_and_Loss__c record: ' + ex.getMessage());
        }
    }
}

