using BusinessPartnerA2X from './external/BusinessPartnerA2X.cds';

service BusinessPartnerA2XSampleService {
    @readonly
    entity A_AddressEmailAddress as projection on BusinessPartnerA2X.A_AddressEmailAddress
    {        key AddressID, key Person, key OrdinalNumber, IsDefaultEmailAddress, EmailAddress, SearchEmailAddress, AddressCommunicationRemarkText     }    
;
    @readonly
    entity A_AddressFaxNumber as projection on BusinessPartnerA2X.A_AddressFaxNumber
    {        key AddressID, key Person, key OrdinalNumber, IsDefaultFaxNumber, FaxCountry, FaxNumber, FaxNumberExtension, InternationalFaxNumber, AddressCommunicationRemarkText     }    
;
    @readonly
    entity A_AddressHomePageURL as projection on BusinessPartnerA2X.A_AddressHomePageURL
    {        key AddressID, key Person, key OrdinalNumber, key ValidityStartDate, key IsDefaultURLAddress, SearchURLAddress, AddressCommunicationRemarkText, URLFieldLength, WebsiteURL     }    
;
}