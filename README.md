# lakeworthdigital1


            // After OCR processing, introduce a delay before calling the fetchExtractedText method
            Integer delayInMinutes = 5;  // Set delay of 5 minutes before fetching extracted text
            System.debug('Waiting for ' + delayInMinutes + ' minutes before fetching the extracted text.');
            
            // Enqueue another job to fetch the extracted text after the delay
            System.enqueueJob(new FetchExtractedTextWithDelayJob(contentDocumentId, recordId, ocrResult), delayInMinutes);





public class FetchExtractedTextWithDelayJob implements Queueable, Database.AllowsCallouts {
    private String contentDocumentId;
    private String ocrDocumentScanResultId;

    public FetchExtractedTextWithDelayJob(String contentDocumentId, String ocrDocumentScanResultId) {
        this.contentDocumentId = contentDocumentId;
        this.ocrDocumentScanResultId = ocrDocumentScanResultId;
    }

    public void execute(QueueableContext context) {
        // Wait until the status is "SUCCESS" before calling fetchExtractedText
        String status = checkOCRStatus(ocrDocumentScanResultId);

        if ('SUCCESS'.equals(status)) {
            // Fetch the extracted text now
            fetchExtractedText(ocrDocumentScanResultId, contentDocumentId);
        } else {
            // Retry if OCR status is still not SUCCESS
            System.debug('OCR status is still not "SUCCESS", retrying...');
            Integer delayInMinutes = 5;  // Retry after 5 minutes
            System.enqueueJob(new FetchExtractedTextWithDelayJob(contentDocumentId, ocrDocumentScanResultId), delayInMinutes);
        }
    }

    private String checkOCRStatus(String ocrDocumentScanResultId) {
        // Check the OCR status similar to your previous implementation
        // Use the same logic as before to check the OCR status.
        return 'SUCCESS';  // Return the status (this is just a placeholder; replace with actual logic)
    }

    private void fetchExtractedText(String ocrDocumentScanResultId, String contentDocumentId) {
        // Implement your fetchExtractedText logic here
        System.debug('Fetching extracted text...');
    }
}
