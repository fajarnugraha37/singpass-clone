# Contract: Myinfo v5 UserInfo Payload

**Purpose**: Defines the compliant structure for the `person_info` claim returned by the `/userinfo` endpoint.

## Data Structure

The UserInfo response is a signed and encrypted JWT containing the following JSON structure in its payload:

```json
{
  "sub": "persistent-uuid-here",
  "person_info": {
    "uinfin": {
      "value": "S1234567A",
      "source": "1",
      "classification": "C",
      "lastupdated": "2024-03-18"
    },
    "name": {
      "value": "JOHN DOE",
      "source": "1",
      "classification": "C",
      "lastupdated": "2024-03-18"
    },
    "regadd": {
      "type": "SG",
      "block": { "value": "123", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
      "street": { "value": "SINGAPORE STREET", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
      "postal": { "value": "123456", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
      "country": {
        "code": "SG",
        "desc": "SINGAPORE"
      }
    },
    "vehicles": [
      {
        "vehicleno": { "value": "SBA1234A", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "type": { "value": "PRIVATE MOTOR CAR", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "make": { "value": "TOYOTA", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "model": { "value": "COROLLA", "source": "1", "classification": "C", "lastupdated": "2024-03-18" }
      }
    ],
    "cpfcontributions": [
      {
        "date": { "value": "2024-02-01", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "amount": { "value": 1500, "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "employer": { "value": "TECH CORP", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "month": { "value": "2024-01", "source": "1", "classification": "C", "lastupdated": "2024-03-18" }
      },
      {
        "date": { "value": "2024-03-01", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "amount": { "value": 1500, "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "employer": { "value": "TECH CORP", "source": "1", "classification": "C", "lastupdated": "2024-03-18" },
        "month": { "value": "2024-02", "source": "1", "classification": "C", "lastupdated": "2024-03-18" }
      }
    ]
  }
}
```

## Validation Rules

1.  **Metadata Presence**: Every leaf field (except `type` and `country` inside `regadd`) MUST include `source`, `classification`, and `lastupdated`.
2.  **`regadd` Type**: `regadd.type` MUST be a direct string property.
3.  **`regadd` Country**: `regadd.country` MUST be an object containing `code` and `desc`.
4.  **`vehicles` Array**: `vehicles` MUST be an array of objects.
5.  **CPF Sorting**: `cpfcontributions` MUST be returned in ascending order by `date.value`.
6.  **CPF Month**: Every `cpfcontributions` record MUST include a `month` field in `YYYY-MM` format.
