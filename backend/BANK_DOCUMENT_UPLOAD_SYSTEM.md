# Bank Account Document Upload System

This document explains the document upload system for bank account verification.

## 📁 Folder Structure in MinIO

The system automatically segregates documents into separate folders based on document type:

```
mybucket/
├── documents/
│   ├── licenses/          # Driving licenses, ID cards
│   ├── citizenship/       # Citizenship certificates, national IDs  
│   └── passports/         # Passport documents
```

## 🔄 API Endpoints

### User Endpoints

#### 1. Get Document Upload Information
```
GET /api/bank/document-info
```
Returns upload requirements, allowed file types, and folder structure information.

#### 2. Create Bank Account with Document
```
POST /api/bank/accounts
Content-Type: multipart/form-data

Required Fields:
- bankName: string
- accountNumber: string
- accountName: string
- associatedPhoneNumber: string
- documentType: "license" | "citizenship" | "passport"
- documentNumber: string
- documentImage: file (JPEG, PNG, GIF, PDF)

Optional Fields:
- isPrimary: boolean
- notes: string
```

#### 3. Update Bank Account (with optional document update)
```
PUT /api/bank/accounts/:id
Content-Type: multipart/form-data

Optional Fields:
- bankName: string
- accountName: string
- associatedPhoneNumber: string
- documentType: "license" | "citizenship" | "passport"
- documentNumber: string
- documentImage: file (JPEG, PNG, GIF, PDF)
- isPrimary: boolean
- notes: string
```

#### 4. Upload/Update Document Only
```
POST /api/bank/accounts/:id/upload-document
Content-Type: multipart/form-data

Required Fields:
- documentType: "license" | "citizenship" | "passport"
- documentImage: file (JPEG, PNG, GIF, PDF)
```

## 📋 File Requirements

### Allowed File Types
- **Images**: JPEG, JPG, PNG, GIF
- **Documents**: PDF

### File Size Limits
- **Maximum**: 10MB per file
- **Recommended**: Under 5MB for better performance

### Document Types
1. **License** (`license`)
   - Driving licenses
   - Government-issued ID cards
   - Storage: `documents/licenses/`

2. **Citizenship** (`citizenship`)
   - Citizenship certificates
   - National ID cards
   - Birth certificates
   - Storage: `documents/citizenship/`

3. **Passport** (`passport`)
   - Passport documents
   - Travel documents
   - Storage: `documents/passports/`

## 🔒 Security Features

### Authentication
- All endpoints require user authentication
- Users can only access their own bank accounts

### File Validation
- File type validation (whitelist approach)
- File size limits enforcement
- Document type matching validation

### Error Handling
- Automatic cleanup of uploaded files on errors
- Graceful handling of invalid uploads
- Detailed error messages

### File Management
- Old documents are automatically deleted when replaced
- Verification status resets when documents change
- Audit trail maintained for all changes

## 📤 Response Format

### Successful Upload Response
```json
{
  "success": true,
  "message": "Bank account created successfully",
  "data": {
    "_id": "...",
    "bankName": "...",
    "documentImage": "http://127.0.0.1:9000/mybucket/documents/licenses/license-userId-timestamp-random.jpg",
    "uploadedDocument": {
      "filename": "license-userId-timestamp-random.jpg",
      "folder": "documents/licenses",
      "url": "http://127.0.0.1:9000/mybucket/documents/licenses/license-userId-timestamp-random.jpg",
      "documentType": "license"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid document type. Must be license, citizenship, or passport"
}
```

## 🗂️ File Naming Convention

Files are automatically named using this pattern:
```
{documentType}-{userId}-{timestamp}-{randomString}.{extension}
```

Example:
```
license-64f1a2b3c4d5e6f7g8h9i0j1-1640995200000-123456789.jpg
```

## 🔄 Workflow

1. **Upload**: User uploads document with bank account creation/update
2. **Validation**: System validates file type, size, and document type
3. **Storage**: File stored in appropriate folder in MinIO
4. **Processing**: Bank account updated with document URL
5. **Verification**: Account status set to 'pending' for admin review
6. **Cleanup**: Old documents deleted if being replaced

## 🛠️ Admin Features

Admins can:
- View all uploaded documents
- Verify or reject bank accounts
- Access document URLs for review
- Track document upload history

## 📝 Usage Examples

### Frontend Implementation Example

```javascript
// Create bank account with document
const formData = new FormData();
formData.append('bankName', 'ABC Bank');
formData.append('accountNumber', '1234567890');
formData.append('accountName', 'John Doe');
formData.append('associatedPhoneNumber', '+1234567890');
formData.append('documentType', 'license');
formData.append('documentNumber', 'DL123456');
formData.append('documentImage', fileInput.files[0]);

const response = await fetch('/api/bank/accounts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### cURL Example

```bash
curl -X POST http://localhost:3000/api/bank/accounts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "bankName=ABC Bank" \
  -F "accountNumber=1234567890" \
  -F "accountName=John Doe" \
  -F "associatedPhoneNumber=+1234567890" \
  -F "documentType=license" \
  -F "documentNumber=DL123456" \
  -F "documentImage=@/path/to/document.jpg"
```

## 🔧 Configuration

The document upload system uses the following configuration:

```javascript
// Document folders in MinIO
const documentFolders = {
  'license': 'documents/licenses',
  'citizenship': 'documents/citizenship', 
  'passport': 'documents/passports'
};

// File constraints
const fileConstraints = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
};
```

## 🐛 Troubleshooting

### Common Issues

1. **File too large**: Ensure file is under 10MB
2. **Invalid file type**: Only JPEG, PNG, GIF, PDF allowed
3. **Document type mismatch**: Ensure documentType matches uploaded file
4. **Authentication error**: Verify valid JWT token
5. **MinIO connection**: Check MinIO server is running

### Error Codes

- `400`: Bad request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Bank account not found
- `413`: File too large
- `415`: Unsupported file type
- `500`: Server error (file upload/processing failed)
