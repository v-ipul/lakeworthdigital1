public with sharing class FileUploadController {
    
    @AuraEnabled
    public static void invokeFlow(String contentDocumentId) {
        // Check if ContentDocumentId is provided
        if (String.isEmpty(contentDocumentId)) {
            throw new AuraHandledException('ContentDocumentId cannot be null or empty');
        }
        
        // Create a Flow variable for ContentDocumentId
        Map<String, Object> flowParams = new Map<String, Object>();
        flowParams.put('ContentDocumentId', contentDocumentId);

        // Start the flow
        Flow.Interview.MyAutoLaunchFlow flow = new Flow.Interview.MyAutoLaunchFlow(flowParams);
        flow.start();
    }
}
