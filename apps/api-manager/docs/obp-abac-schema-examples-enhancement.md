# OBP API ABAC Schema Examples Enhancement

## Overview

This document provides comprehensive examples for the `/obp/v6.0.0/management/abac-rules-schema` endpoint in the OBP API. These examples should replace or supplement the current `examples` array in the API response to provide better guidance for writing ABAC rules.

## Current State

The current OBP API returns a limited set of examples that don't cover all 19 available parameters.

## Proposed Enhancement

Replace the `examples` array in the schema response with the following comprehensive set of examples covering all parameters and common use cases.

---

## Recommended Examples Array

### 1. authenticatedUser (User) - Required

Always available - the logged-in user making the request.

```scala
"// Check authenticated user's email domain",
"authenticatedUser.emailAddress.contains(\"@example.com\")",

"// Check authentication provider",
"authenticatedUser.provider == \"obp\"",

"// Check if authenticated user matches target user",
"authenticatedUser.userId == userOpt.get.userId",

"// Check user's display name",
"authenticatedUser.name.startsWith(\"Admin\")",

"// Safe check for deleted users",
"!authenticatedUser.isDeleted.getOrElse(false)",
```

---

### 2. authenticatedUserAttributes (List[UserAttributeTrait]) - Required

Non-personal attributes of the authenticated user.

```scala
"// Check if user has admin role",
"authenticatedUserAttributes.exists(attr => attr.name == \"role\" && attr.value == \"admin\")",

"// Check user's department",
"authenticatedUserAttributes.find(_.name == \"department\").exists(_.value == \"finance\")",

"// Check if user has any clearance level",
"authenticatedUserAttributes.exists(_.name == \"clearance_level\")",

"// Filter by attribute type",
"authenticatedUserAttributes.filter(_.attributeType == AttributeType.STRING).nonEmpty",

"// Check for multiple roles",
"authenticatedUserAttributes.exists(attr => attr.name == \"role\" && List(\"admin\", \"manager\").contains(attr.value))",
```

---

### 3. authenticatedUserAuthContext (List[UserAuthContext]) - Required

Authentication context of the authenticated user.

```scala
"// Check session type",
"authenticatedUserAuthContext.exists(_.key == \"session_type\" && _.value == \"secure\")",

"// Ensure auth context exists",
"authenticatedUserAuthContext.nonEmpty",

"// Check authentication method",
"authenticatedUserAuthContext.exists(_.key == \"auth_method\" && _.value == \"certificate\")",
```

---

### 4. onBehalfOfUserOpt (Option[User]) - Optional

User being acted on behalf of (delegation scenario).

```scala
"// Check if acting on behalf of self",
"onBehalfOfUserOpt.isDefined && onBehalfOfUserOpt.get.userId == authenticatedUser.userId",

"// Safe check delegation user's email",
"onBehalfOfUserOpt.exists(_.emailAddress.endsWith(\"@company.com\"))",

"// Pattern matching for safe access",
"onBehalfOfUserOpt match { case Some(u) => u.provider == \"obp\" case None => true }",

"// Ensure delegation user is different",
"onBehalfOfUserOpt.forall(_.userId != authenticatedUser.userId)",

"// Check if delegation exists",
"onBehalfOfUserOpt.isDefined",
```

---

### 5. onBehalfOfUserAttributes (List[UserAttributeTrait]) - Optional

Attributes of the delegation user.

```scala
"// Check delegation level",
"onBehalfOfUserAttributes.exists(attr => attr.name == \"delegation_level\" && attr.value == \"full\")",

"// Allow if no delegation or authorized delegation",
"onBehalfOfUserAttributes.isEmpty || onBehalfOfUserAttributes.exists(_.name == \"authorized\")",

"// Check delegation permissions",
"onBehalfOfUserAttributes.exists(attr => attr.name == \"permissions\" && attr.value.contains(\"read\"))",
```

---

### 6. onBehalfOfUserAuthContext (List[UserAuthContext]) - Optional

Auth context of the delegation user.

```scala
"// Check for delegation token",
"onBehalfOfUserAuthContext.exists(_.key == \"delegation_token\")",

"// Verify delegation auth method",
"onBehalfOfUserAuthContext.exists(_.key == \"auth_method\" && _.value == \"oauth\")",
```

---

### 7. userOpt (Option[User]) - Optional

Target user being evaluated in the request.

```scala
"// Check if target user matches authenticated user",
"userOpt.isDefined && userOpt.get.userId == authenticatedUser.userId",

"// Check target user's provider",
"userOpt.exists(_.provider == \"obp\")",

"// Ensure user is not deleted",
"userOpt.forall(!_.isDeleted.getOrElse(false))",

"// Check user email domain",
"userOpt.exists(_.emailAddress.endsWith(\"@trusted.com\"))",
```

---

### 8. userAttributes (List[UserAttributeTrait]) - Optional

Attributes of the target user.

```scala
"// Check target user's account type",
"userAttributes.exists(attr => attr.name == \"account_type\" && attr.value == \"premium\")",

"// Check KYC status",
"userAttributes.exists(attr => attr.name == \"kyc_status\" && attr.value == \"verified\")",

"// Check user tier",
"userAttributes.find(_.name == \"tier\").exists(_.value.toInt >= 2)",
```

---

### 9. bankOpt (Option[Bank]) - Optional

Bank context in the request.

```scala
"// Check for specific bank",
"bankOpt.isDefined && bankOpt.get.bankId.value == \"gh.29.uk\"",

"// Check bank name contains text",
"bankOpt.exists(_.fullName.contains(\"Community\"))",

"// Check bank routing scheme",
"bankOpt.exists(_.bankRoutingScheme == \"IBAN\")",

"// Check bank website",
"bankOpt.exists(_.websiteUrl.contains(\"https://\"))",
```

---

### 10. bankAttributes (List[BankAttributeTrait]) - Optional

Bank attributes.

```scala
"// Check bank region",
"bankAttributes.exists(attr => attr.name == \"region\" && attr.value == \"EU\")",

"// Check bank license type",
"bankAttributes.exists(attr => attr.name == \"license_type\" && attr.value == \"full\")",

"// Check if bank is certified",
"bankAttributes.exists(attr => attr.name == \"certified\" && attr.value == \"true\")",
```

---

### 11. accountOpt (Option[BankAccount]) - Optional

Account context in the request.

```scala
"// Check account balance threshold",
"accountOpt.isDefined && accountOpt.get.balance > 1000",

"// Check account currency and balance",
"accountOpt.exists(acc => acc.currency == \"USD\" && acc.balance > 5000)",

"// Check account type",
"accountOpt.exists(_.accountType == \"SAVINGS\")",

"// Check account label",
"accountOpt.exists(_.label.contains(\"Business\"))",

"// Check account number format",
"accountOpt.exists(_.number.length >= 10)",
```

---

### 12. accountAttributes (List[AccountAttribute]) - Optional

Account attributes.

```scala
"// Check account status",
"accountAttributes.exists(attr => attr.name == \"status\" && attr.value == \"active\")",

"// Check account tier",
"accountAttributes.exists(attr => attr.name == \"account_tier\" && attr.value == \"gold\")",

"// Check overdraft protection",
"accountAttributes.exists(attr => attr.name == \"overdraft_protection\" && attr.value == \"enabled\")",
```

---

### 13. transactionOpt (Option[Transaction]) - Optional

Transaction context in the request.

```scala
"// Check transaction amount limit",
"transactionOpt.isDefined && transactionOpt.get.amount < 10000",

"// Check transaction type",
"transactionOpt.exists(_.transactionType.contains(\"TRANSFER\"))",

"// Check transaction currency and amount",
"transactionOpt.exists(t => t.currency == \"EUR\" && t.amount > 100)",

"// Check transaction status",
"transactionOpt.exists(_.status.exists(_ == \"COMPLETED\"))",

"// Check transaction balance after",
"transactionOpt.exists(_.balance > 0)",
```

---

### 14. transactionAttributes (List[TransactionAttribute]) - Optional

Transaction attributes.

```scala
"// Check transaction category",
"transactionAttributes.exists(attr => attr.name == \"category\" && attr.value == \"business\")",

"// Check risk score",
"transactionAttributes.exists(attr => attr.name == \"risk_score\" && attr.value.toInt < 50)",

"// Check if transaction is flagged",
"!transactionAttributes.exists(attr => attr.name == \"flagged\" && attr.value == \"true\")",
```

---

### 15. transactionRequestOpt (Option[TransactionRequest]) - Optional

Transaction request context.

```scala
"// Check transaction request status",
"transactionRequestOpt.exists(_.status == \"PENDING\")",

"// Check transaction request type",
"transactionRequestOpt.exists(_.type == \"SEPA\")",

"// Check bank matches",
"transactionRequestOpt.exists(_.this_bank_id.value == bankOpt.get.bankId.value)",

"// Check account matches",
"transactionRequestOpt.exists(_.this_account_id.value == accountOpt.get.accountId.value)",
```

---

### 16. transactionRequestAttributes (List[TransactionRequestAttributeTrait]) - Optional

Transaction request attributes.

```scala
"// Check priority level",
"transactionRequestAttributes.exists(attr => attr.name == \"priority\" && attr.value == \"high\")",

"// Check if approval required",
"transactionRequestAttributes.exists(attr => attr.name == \"approval_required\" && attr.value == \"true\")",

"// Check request source",
"transactionRequestAttributes.exists(attr => attr.name == \"source\" && attr.value == \"mobile_app\")",
```

---

### 17. customerOpt (Option[Customer]) - Optional

Customer context in the request.

```scala
"// Check customer legal name",
"customerOpt.exists(_.legalName.contains(\"Corp\"))",

"// Check customer email matches user",
"customerOpt.isDefined && customerOpt.get.email == authenticatedUser.emailAddress",

"// Check customer relationship status",
"customerOpt.exists(_.relationshipStatus == \"ACTIVE\")",

"// Check customer has dependents",
"customerOpt.exists(_.dependents > 0)",

"// Check customer mobile number exists",
"customerOpt.exists(_.mobileNumber.nonEmpty)",
```

---

### 18. customerAttributes (List[CustomerAttribute]) - Optional

Customer attributes.

```scala
"// Check customer risk level",
"customerAttributes.exists(attr => attr.name == \"risk_level\" && attr.value == \"low\")",

"// Check VIP status",
"customerAttributes.exists(attr => attr.name == \"vip_status\" && attr.value == \"true\")",

"// Check customer segment",
"customerAttributes.exists(attr => attr.name == \"segment\" && attr.value == \"retail\")",
```

---

### 19. callContext (Option[CallContext]) - Optional

Request call context with metadata.

```scala
"// Check if request is from internal network",
"callContext.exists(_.ipAddress.exists(_.startsWith(\"192.168\")))",

"// Check if request is from mobile device",
"callContext.exists(_.userAgent.exists(_.contains(\"Mobile\")))",

"// Only allow GET requests",
"callContext.exists(_.verb.exists(_ == \"GET\"))",

"// Check request URL path",
"callContext.exists(_.url.exists(_.contains(\"/accounts/\")))",

"// Check if request is from external IP",
"callContext.exists(_.ipAddress.exists(!_.startsWith(\"10.\")))",
```

---

## Complex Examples

Combining multiple parameters and conditions:

```scala
"// Admin from trusted domain accessing any account",
"authenticatedUser.emailAddress.endsWith(\"@bank.com\") && accountOpt.exists(_.balance > 0) && bankOpt.exists(_.bankId.value == \"gh.29.uk\")",

"// Manager accessing other user's data",
"authenticatedUserAttributes.exists(_.name == \"role\" && _.value == \"manager\") && userOpt.exists(_.userId != authenticatedUser.userId)",

"// Self-access or authorized delegation with sufficient balance",
"(onBehalfOfUserOpt.isEmpty || onBehalfOfUserOpt.exists(_.userId == authenticatedUser.userId)) && accountOpt.exists(_.balance > 1000)",

"// External high-value transaction with risk check",
"callContext.exists(_.ipAddress.exists(!_.startsWith(\"10.\"))) && transactionOpt.exists(_.amount > 5000) && !transactionAttributes.exists(_.name == \"risk_flag\")",

"// VIP customer with premium account and active status",
"customerAttributes.exists(_.name == \"vip_status\" && _.value == \"true\") && accountAttributes.exists(_.name == \"account_tier\" && _.value == \"premium\") && customerOpt.exists(_.relationshipStatus == \"ACTIVE\")",

"// Verified user with proper delegation accessing specific bank",
"userAttributes.exists(_.name == \"kyc_status\" && _.value == \"verified\") && (onBehalfOfUserOpt.isEmpty || onBehalfOfUserAttributes.exists(_.name == \"authorized\")) && bankOpt.exists(_.bankId.value.startsWith(\"gh\"))",
```

---

## Advanced Patterns

Safe Option handling patterns:

```scala
"// Pattern matching for Option types",
"userOpt match { case Some(u) => u.userId == authenticatedUser.userId case None => false }",

"// Using exists for safe access",
"accountOpt.exists(_.balance > 0)",

"// Using forall for negative conditions",
"userOpt.forall(!_.isDeleted.getOrElse(false))",

"// Combining isDefined with get (only when you've checked isDefined)",
"accountOpt.isDefined && accountOpt.get.balance > 1000",

"// Using getOrElse for defaults",
"accountOpt.map(_.balance).getOrElse(0) > 100",
```

---

## Important Notes to Include

The schema response should also emphasize these notes:

1. **PARAMETER NAMES**: Use exact parameter names: `authenticatedUser`, `userOpt`, `accountOpt`, `bankOpt`, `transactionOpt`, etc. (NOT `user`, `account`, `bank`)

2. **PROPERTY NAMES**: Use camelCase - `userId` (NOT `user_id`), `accountId` (NOT `account_id`), `emailAddress` (NOT `email_address`)

3. **OPTION TYPES**: Only `authenticatedUser`, `authenticatedUserAttributes`, and `authenticatedUserAuthContext` are guaranteed. All others are `Option` types - always check `isDefined` before using `.get`, or use safe methods like `exists()`, `forall()`, `map()`

4. **LIST TYPES**: Attributes are Lists - use Scala collection methods like `exists()`, `find()`, `filter()`, `forall()`

5. **SAFE OPTION HANDLING**: Prefer pattern matching or `exists()` over `isDefined` + `.get`

6. **RETURN TYPE**: Rules must return Boolean - `true` = access granted, `false` = access denied

7. **AUTO-FETCHING**: Objects are automatically fetched based on IDs passed to the execute endpoint

8. **COMMON MISTAKE**: Writing `user.user_id` instead of `userOpt.get.userId` or `authenticatedUser.userId`

---

## Implementation Location

In the OBP-API repository:
- Find the endpoint implementation for `GET /obp/v6.0.0/management/abac-rules-schema`
- Update the `examples` field in the response JSON
- Likely located in APIv6.0.0 package

---

## Testing

After updating, verify:
1. All examples are syntactically correct Scala expressions
2. Examples cover all 19 parameters
3. Examples demonstrate both simple and complex patterns
4. Safe Option handling is demonstrated
5. Common pitfalls are addressed

---

*Document Version: 1.0*  
*Created: 2024*  
*Purpose: Enhancement specification for OBP API ABAC rule schema examples*
