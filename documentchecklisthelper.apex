/**
 * @description       : Document checklist component helper class
 * @author            : lakeworthdigital
 * @group             :
 * @last modified on  : 04-24-2025
 * @last modified by  : lakeworthdigital
 * Modification Log   :
 * Modification Date  Modification By    Modification Description
 *  04-24-2025        lakeworthdigital         Initial Version
 **/
public without sharing class DocumentChecklistHelper {
    /**
     * @description
     * @author  | 04-23-2025
     * @param parentRecordId
     * @return List<DocumentChecklistItem>
     **/
    @AuraEnabled(cacheable=true)
    public static List<DocumentChecklistItem> getDocumentChecklistIems(String parentRecordId) {
        List<DocumentChecklistItem> documentcheckList;
        try {
            documentcheckList = [
                SELECT
                    Id,
                    Name,
                    Status,
                    (
                        SELECT Id, ContentDocument.Title, ContentDocument.CreatedDate, ContentDocument.CreatedBy.Name
                        FROM ContentDocumentLinks
                    )
                FROM DocumentChecklistItem
                WHERE ParentRecordId = :parentRecordId
                WITH SECURITY_ENFORCED
            ];
            System.debug(JSON.serialize(documentcheckList));
            return documentcheckList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * @description
     * @author  | 04-23-2025
     * @param dcId
     * @param dcStatus
     **/
    @AuraEnabled
    public static void updateDCIStatus(String docChecklistItemId) {
        DocumentChecklistItem dc = new DocumentChecklistItem(Id = docChecklistItemId, Status = 'Uploaded');
        try {
            update dc;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
