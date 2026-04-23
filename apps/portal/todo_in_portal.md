
    logger.info (s"props_identifier is : ${APIUtil.getPropsValue("props_identifier", "NONE-SET")}")

    // This will work for both portal and API modes. This page is used for testing if the API is running properly.
    val awakePage = List( Menu.i("awake") /"debug" / "awake")

    val commonMap = List(Menu.i("Home") / "index") ::: List(
      Menu.i("index-en") / "index-en",
      Menu.i("Plain") / "plain",
      Menu.i("Static") / "static",
      Menu.i("SDKs") / "sdks",
      Menu.i("Consents") / "consents",
      Menu.i("Debug") / "debug",
      Menu.i("debug-basic") / "debug" / "debug-basic",
      Menu.i("debug-default-header") / "debug" / "debug-default-header",
      Menu.i("debug-default-footer") / "debug" / "debug-default-footer",
      Menu.i("debug-localization") / "debug" / "debug-localization",
      Menu.i("debug-plain") / "debug" / "debug-plain",
      Menu.i("debug-webui") / "debug" / "debug-webui",
      Menu.i("Consumer Admin") / "admin" / "consumers" >> Admin.loginFirst >> LocGroup("admin")
        submenus(Consumer.menus : _*),

      Menu("Consent Screen", Helper.i18n("consent.screen")) / "consent-screen" >> AuthUser.loginFirst,
      Menu("Dummy user tokens", "Get Dummy user tokens") / "dummy-user-tokens" >> AuthUser.loginFirst,

      Menu("Validate OTP", "Validate OTP") / "otp" >> AuthUser.loginFirst,
      Menu("User Information", "User Information") / "user-information",
      Menu("User Invitation", "User Invitation") / "user-invitation",
      Menu("User Invitation Info", "User Invitation Info") / "user-invitation-info",
      Menu("User Invitation Invalid", "User Invitation Invalid") / "user-invitation-invalid",
      Menu("User Invitation Warning", "User Invitation Warning") / "user-invitation-warning",
      Menu("Already Logged In", "Already Logged In") / "already-logged-in",
      Menu("Terms and Conditions", "Terms and Conditions") / "terms-and-conditions",
      Menu("Privacy Policy", "Privacy Policy") / "privacy-policy",
      // Menu.i("Metrics") / "metrics", //TODO: allow this page once we can make the account number anonymous in the URL
      Menu.i("OAuth") / "oauth" / "authorize", //OAuth authorization page
      Menu.i("Consent") / "consent" >> AuthUser.loginFirst,//OAuth consent page
      OAuthWorkedThanks.menu, //OAuth thanks page that will do the redirect
      Menu.i("Introduction") / "introduction",
      Menu.i("add-user-auth-context-update-request") / "add-user-auth-context-update-request",
      Menu.i("confirm-user-auth-context-update-request") / "confirm-user-auth-context-update-request",
      Menu.i("confirm-bg-consent-request") / "confirm-bg-consent-request" >> AuthUser.loginFirst,//OAuth consent page,
      Menu.i("confirm-bg-consent-request-sca") / "confirm-bg-consent-request-sca" >> AuthUser.loginFirst,//OAuth consent page,
      Menu.i("confirm-bg-consent-request-redirect-uri") / "confirm-bg-consent-request-redirect-uri" >> AuthUser.loginFirst,//OAuth consent page,
      Menu.i("confirm-vrp-consent-request") / "confirm-vrp-consent-request" >> AuthUser.loginFirst,//OAuth consent page,
      Menu.i("confirm-vrp-consent") / "confirm-vrp-consent" >> AuthUser.loginFirst //OAuth consent page
    ) ++ accountCreation ++ Admin.menus++ awakePage
    
    
    
    
    
    
    
    
    
    ===========
    
    obp-api/src/main/scala/code/snippet/BerlinGroupConsent.scala
    
    
    /**
     * Open Bank Project - API
     * Copyright (C) 2011-2019, TESOBE GmbH.
     *
     * This program is free software: you can redistribute it and/or modify
     * it under the terms of the GNU Affero General Public License as published by
     * the Free Software Foundation, either version 3 of the License, or
     * (at your option) any later version.
     *
     * This program is distributed in the hope that it will be useful,
     * but WITHOUT ANY WARRANTY; without even the implied warranty of
     * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     * GNU Affero General Public License for more details.
     *
     * You should have received a copy of the GNU Affero General Public License
     * along with this program.  If not, see <http://www.gnu.org/licenses/>.
     *
     * Email: contact@tesobe.com
     * TESOBE GmbH.
     * Osloer Strasse 16/17
     * Berlin 13359, Germany
     *
     * This product includes software developed at
     * TESOBE (http://www.tesobe.com/)
     */
    package code.snippet
    
    import code.accountholders.AccountHolders
    import code.api.RequestHeader
    import code.api.berlin.group.v1_3.JSONFactory_BERLIN_GROUP_1_3.{ConsentAccessAccountsJson, ConsentAccessJson, GetConsentResponseJson, createGetConsentResponseJson}
    import code.api.util.ErrorMessages.ConsentNotFound
    import code.api.util._
    import code.api.v3_1_0.APIMethods310
    import code.api.v5_0_0.APIMethods500
    import code.api.v5_1_0.APIMethods510
    import code.consent.{ConsentStatus, Consents, MappedConsent}
    import code.consumer.Consumers
    import code.model.dataAccess.{AuthUser, BankAccountRouting}
    import code.util.Helper.{MdcLoggable, ObpS}
    import com.openbankproject.commons.ExecutionContext.Implicits.global
    import com.openbankproject.commons.model.BankIdAccountId
    import net.liftweb.common.{Box, Failure, Full}
    import net.liftweb.http.js.JsCmds
    import net.liftweb.http.rest.RestHelper
    import net.liftweb.http.{S, SHtml, SessionVar}
    import net.liftweb.json.{Formats, parse}
    import net.liftweb.mapper.By
    import net.liftweb.util.CssSel
    import net.liftweb.util.Helpers._
    
    import scala.collection.immutable
    import scala.concurrent.Future
    import scala.xml.NodeSeq
    
    /**
     * This class handles Berlin Group consent requests.
     * It provides functionality to confirm or deny consent requests,
     * and manages the consent process for accessing account data.
     */
    class BerlinGroupConsent extends MdcLoggable with RestHelper with APIMethods510 with APIMethods500 with APIMethods310 {
      // Custom JSON formats for serialization/deserialization
      protected implicit override def formats: Formats = CustomJsonFormats.formats
    
      // Session variables to store OTP, redirect URI, and other consent-related data
      private object otpValue extends SessionVar("123") // Stores the OTP value for SCA (Strong Customer Authentication)
      private object redirectUriValue extends SessionVar("") // Stores the redirect URI for post-consent actions
      private object tppNokRedirectUriValue extends SessionVar("")
      private object consumerNameValue extends SessionVar("") // Stores the redirect URI for post-consent actions
      private object updateConsentPayloadValue extends SessionVar(false) // Flag to indicate if consent payload needs updating
      private object userIsOwnerOfAccountsValue extends SessionVar(true) // Flag to check if the user owns the accounts
    
      // Session variables to store selected IBANs for accounts, balances, and transactions
      private object selectedAccountsIbansValue extends SessionVar[Set[String]](Set()) {
        override def set(value: Set[String]): Set[String] = {
          logger.debug(s"selectedAccountsIbansValue changed to: ${value.mkString(", ")}")
          super.set(value)
        }
      }
      private object accessAccountsDefinedVar extends SessionVar(true)
      private object accessBalancesDefinedVar extends SessionVar(false)
      private object accessTransactionsDefinedVar extends SessionVar(false)
      /**
       * Creates a ConsentAccessJson object from lists of IBANs for accounts, balances, and transactions.
       *
       * @param accounts     List of IBANs for accounts.
       * @param balances     List of IBANs for balances.
       * @param transactions List of IBANs for transactions.
       * @return ConsentAccessJson object.
       */
      def createConsentAccessJson(accounts: List[String], balances: List[String], transactions: List[String]): ConsentAccessJson = {
        val accountsList = accounts.map(iban => ConsentAccessAccountsJson(iban = Some(iban), None, None, None, None, None))
        val balancesList = balances.map(iban => ConsentAccessAccountsJson(iban = Some(iban), None, None, None, None, None))
        val transactionsList = transactions.map(iban => ConsentAccessAccountsJson(iban = Some(iban), None, None, None, None, None))
    
        ConsentAccessJson(
          accounts = Some(accountsList), // Populate accounts
          balances = if (balancesList.nonEmpty) Some(balancesList) else None, // Populate balances
          transactions = if (transactionsList.nonEmpty) Some(transactionsList) else None // Populate transactions
        )
      }
    
      /**
       * Updates the consent with new IBANs for accounts, balances, and transactions.
       *
       * @param consentId        The ID of the consent to update.
       * @param ibans     List of IBANs for accounts.
       * @return Future[MappedConsent] representing the updated consent.
       */
      private def updateConsent(consentId: String, ibans: List[String], canReadBalances: Boolean, canReadTransactions: Boolean): Future[MappedConsent] = {
        for {
          // Fetch the consent by ID
          consent: MappedConsent <- Future(Consents.consentProvider.vend.getConsentByConsentId(consentId)) map {
            APIUtil.unboxFullOrFail(_, None, s"$ConsentNotFound ($consentId)", 400)
          }
          // Update the consent JWT with new access details
          consentJWT <- Consent.updateAccountAccessOfBerlinGroupConsentJWT(
            createConsentAccessJson(
              ibans,
              if(canReadBalances) ibans else List(),
              if(canReadTransactions) ibans else List()
            ),
            consent,
            None
          ) map {
            i => APIUtil.connectorEmptyResponse(i, None)
          }
          // Save the updated consent
          updatedConsent <- Future(Consents.consentProvider.vend.setJsonWebToken(consent.consentId, consentJWT)) map {
            i => APIUtil.connectorEmptyResponse(i, None)
          }
        } yield {
          updatedConsent
        }
      }
    
      /**
       * Renders the Berlin Group consent confirmation form.
       *
       * @return CssSel for rendering the form.
       */
      def confirmBerlinGroupConsentRequest: CssSel = {
        callGetConsentByConsentId() match {
          case Full(consent) =>
            // Set OTP and redirect URI from the consent
            otpValue.set(consent.challenge)
            val json: GetConsentResponseJson = createGetConsentResponseJson(consent)
            val consumer = Consumers.consumers.vend.getConsumerByConsumerId(consent.consumerId)
            val consentJwt: Box[ConsentJWT] = JwtUtil.getSignedPayloadAsJson(consent.jsonWebToken).map(parse(_)
              .extract[ConsentJWT])
            val tppRedirectUri: immutable.Seq[String] = consentJwt.map { h =>
              h.request_headers.filter(h => h.name == RequestHeader.`TPP-Redirect-URI`)
            }.getOrElse(Nil).map((_.values.mkString("")))
            val tppNokRedirectUri: immutable.Seq[String] = consentJwt.map { h =>
              h.request_headers.filter(h => h.name == RequestHeader.`TPP-Nok-Redirect-URI`)
            }.getOrElse(Nil).map((_.values.mkString("")))
            tppNokRedirectUriValue.set(tppNokRedirectUri.headOption.getOrElse("/"))
            val consumerRedirectUri: Option[String] = consumer.map(_.redirectURL.get).toOption
            val uri: String = tppRedirectUri.headOption.orElse(consumerRedirectUri).getOrElse("https://not.defined.com")
            redirectUriValue.set(uri)
    
            // Get all accounts held by the current user
            val userAccounts: Set[BankIdAccountId] =
              AccountHolders.accountHolders.vend.getAccountsHeldByUser(AuthUser.currentUser.flatMap(_.user.foreign).openOrThrowException(ErrorMessages.AuthenticatedUserIsRequired), Some(null)).toSet
            val userIbans: Set[String] = userAccounts.flatMap { acc =>
              BankAccountRouting.find(
                By(BankAccountRouting.BankId, acc.bankId.value),
                By(BankAccountRouting.AccountId, acc.accountId.value),
                By(BankAccountRouting.AccountRoutingScheme, "IBAN")
              ).map(_.AccountRoutingAddress.get)
            }
            // Select all IBANs
            selectedAccountsIbansValue.set(userIbans)
    
            var canReadAccountsIbansAvailableAccounts: List[String] = List()
            if(json.access.availableAccounts.contains("allAccounts")) { //
              /*
                Access is requested via:
                "access":
                  {
                    "availableAccounts": "allAccounts"
                  }
               */
              accessAccountsDefinedVar.set(true)
              canReadAccountsIbansAvailableAccounts = userIbans.toList
            }
    
            // Determine which IBANs the user can access for accounts, balances, and transactions
            val canReadAccountsIbans: List[String] = json.access.accounts match {
              case Some(accounts) if accounts.isEmpty => // Access is requested via "accounts": []
                updateConsentPayloadValue.set(true)
                accessAccountsDefinedVar.set(true) // only account details access will be provided
                List()
              case Some(accounts) if accounts.flatMap(_.iban).toSet.subsetOf(userIbans) => // Access is requested for specific IBANs
                accessAccountsDefinedVar.set(true)
                accounts.flatMap(_.iban)
              case Some(accounts) => // Logged in user is not an owner of IBAN/IBANs
                userIsOwnerOfAccountsValue.set(false)
                accessAccountsDefinedVar.set(true)
                accounts.flatMap(_.iban) //even if not the owner, we will also show them in the page.
              case None => // Access is not requested
                accessAccountsDefinedVar.set(false)
                List()
            }
            val canReadBalancesIbans: List[String] = json.access.balances match {
              case Some(balances) if balances.isEmpty => // Access is requested via "balances": []
                updateConsentPayloadValue.set(true)
                // access to account details and balances will be provided
                accessAccountsDefinedVar.set(true)
                accessBalancesDefinedVar.set(true)
                List()
              case Some(balances) if balances.flatMap(_.iban).toSet.subsetOf(userIbans) => // Access is requested for specific IBANs
                accessBalancesDefinedVar.set(true)
                balances.flatMap(_.iban)
              case Some(balances) => // Logged in user is not an owner of IBAN/IBANs
                userIsOwnerOfAccountsValue.set(false)
                accessBalancesDefinedVar.set(true)
                balances.flatMap(_.iban)
              case None => // Access is not requested
                accessBalancesDefinedVar.set(false)
                List()
            }
            val canReadTransactionsIbans: List[String] = json.access.transactions match {
              case Some(transactions) if transactions.isEmpty => // Access is requested via "transactions": []
                updateConsentPayloadValue.set(true)
                // access to account details and transactions will be provided
                accessAccountsDefinedVar.set(true)
                accessTransactionsDefinedVar.set(true)
                List()
              case Some(transactions) if transactions.flatMap(_.iban).toSet.subsetOf(userIbans) => // Access is requested for specific IBANs
                accessTransactionsDefinedVar.set(true)
                transactions.flatMap(_.iban)
              case Some(transactions) => // Logged in user is not an owner of IBAN/IBANs
                userIsOwnerOfAccountsValue.set(false)
                accessTransactionsDefinedVar.set(true)
                transactions.flatMap(_.iban)
              case None => // Access is not requested
                accessTransactionsDefinedVar.set(false)
                List()
            }
    
            // all Selected IBANs
            val ibansFromGetConsentResponseJson = (canReadAccountsIbansAvailableAccounts ::: canReadAccountsIbans ::: canReadBalancesIbans ::: canReadTransactionsIbans).distinct
    
            /**
             * Generates toggle switches for IBAN lists.
             *
             * @param scope        The scope of the IBANs (e.g., "canReadAccountsIbans").
             * @param ibans        List of IBANs to display.
             * @param selectedList Set of currently selected IBANs.
             * @return Sequence of NodeSeq representing the toggle switches.
             */
            def generateCheckboxes(scope: String, ibans: List[String], selectedList: Set[String], sessionVar: SessionVar[Set[String]], ibansFromGetConsentResponseJson:List[String]): immutable.Seq[NodeSeq] = {
              if (ibansFromGetConsentResponseJson.isEmpty) {
                ibans.map { iban =>
                  if (updateConsentPayloadValue.is) {
                    // Show toggle switch when updateConsentPayloadValue is true
                    <div class="toggle-container">
                      <label class="switch">
                        {SHtml.ajaxCheckbox(selectedList.contains(iban), checked => {
                        if (checked) {
                          sessionVar.set(selectedList + iban) // Add to selected
                        } else {
                          sessionVar.set(selectedList - iban) // Remove from selected
                        }
                        JsCmds.Noop // Prevents page reload
                      }, "id" -> (iban + scope), "class" -> "toggle-input")}<span class="slider round"></span>
                      </label>
                      <span style="all: unset;" class="toggle-label">
                        {iban}
                      </span>
                    </div>
                  } else {
                    // Show only the IBAN text when updateConsentPayloadValue is false
                    <span style="all: unset;" class="toggle-label">
                      {iban}
                    </span>
                  }
                }
              } else {
                ibansFromGetConsentResponseJson.map { iban =>
                  // Show only the IBAN text when updateConsentPayloadValue is false
                  <span style="all: unset;" class="toggle-label">
                    {iban}
                  </span>
              }
            }
            }
    
            // Form text and user details
            val currentUser = AuthUser.currentUser
            val firstName = currentUser.map(_.firstName.get).getOrElse("")
            val lastName = currentUser.map(_.lastName.get).getOrElse("")
            val consumerName = consumer.map(_.name.get).getOrElse("")
            consumerNameValue.set(consumerName)
            val formText =
              s"""I, $firstName $lastName, consent to the service provider <strong>$consumerName</strong> making the following actions on my behalf:
                 |""".stripMargin
    
            // Converting formText into a NodeSeq for raw HTML
            val formTextHtml: NodeSeq = scala.xml.XML.loadString("<div>" + formText + "</div>")
    
            // Form rendering
            "#confirm-bg-consent-request-form-title *" #> "Please confirm or deny the following consent request:" &
              "#confirm-bg-consent-request-form-text *" #> (
                <div>
                  <p>
                    {formTextHtml}
                  </p>
                  <div>
                    <p><strong>Allowed actions:</strong></p>
                    <p style="padding-left: 20px">
                      Read account details
                      <div style={if (!updateConsentPayloadValue.is) "padding-left: 40px; display: block;" else "display: none;"}>
                        {scala.xml.Unparsed(ibansFromGetConsentResponseJson.map(iban => s"- $iban").mkString("<br/>"))}
                      </div>
                    </p>
                    <p style={if (accessBalancesDefinedVar.is) "padding-left: 20px;" else "padding-left: 20px; display: none;"}>
                      Read account balances
                      <div style={if (!updateConsentPayloadValue.is) "padding-left: 40px; display: block;" else "display: none;"}>
                        {scala.xml.Unparsed(canReadBalancesIbans.map(iban => s"- $iban").mkString("<br/>"))}
                      </div>
                    </p>
                    <p style={if (accessTransactionsDefinedVar.is) "padding-left: 20px;" else "padding-left: 20px; display: none;"}>
                      Read transactions
                      <div style={if (!updateConsentPayloadValue.is) "padding-left: 40px; display: block;" else "display: none;"}>
                        {scala.xml.Unparsed(canReadTransactionsIbans.map(iban => s"- $iban").mkString("<br/>"))}
                      </div>
                    </p>
                  </div>
                  <div style={if (updateConsentPayloadValue.is) "display: block;" else "display: none;"}>
                    <p><strong>Accounts</strong>:</p>
                    <div style="padding-left: 20px">
                      {generateCheckboxes("canReadAccountsIbans", userIbans.toList, selectedAccountsIbansValue.is, selectedAccountsIbansValue, ibansFromGetConsentResponseJson)}
                    </div>
                    <br/>
                  </div>
                  <p>This consent will end on date {json.validUntil}.</p>
                  <p>I understand that I can revoke this consent at any time.</p>
                </div>
                ) & {
              if (userIsOwnerOfAccountsValue) {
                "#confirm-bg-consent-request-confirm-submit-button" #> SHtml.onSubmitUnit(confirmConsentRequestProcess) &
                  "#confirm-bg-consent-request-deny-submit-button" #> SHtml.onSubmitUnit(denyConsentRequestProcess)
              } else {
                S.error(s"User $firstName $lastName is not owner of listed accounts")
                "#confirm-bg-consent-request-confirm-submit-button" #> "" &
                  "#confirm-bg-consent-request-deny-submit-button" #> ""
              }}
    
          case everythingElse =>
            S.error(everythingElse.toString)
            "#confirm-bg-consent-request-form-title *" #> s"Please confirm or deny the following consent request:" &
              "type=submit" #> ""
        }
      }
    
      /**
       * Fetches a consent by its ID.
       *
       * @return Box[MappedConsent] containing the consent if found.
       */
      private def callGetConsentByConsentId(): Box[MappedConsent] = {
        val requestParam = List(
          ObpS.param("CONSENT_ID"),
        )
        if (requestParam.count(_.isDefined) < requestParam.size) {
          Failure("Parameter CONSENT_ID is missing, please set it in the URL")
        } else {
          val consentId = ObpS.param("CONSENT_ID") openOr ("")
          Consents.consentProvider.vend.getConsentByConsentId(consentId)
        }
      }
    
      /**
       * Handles the confirmation of a consent request.
       */
      private def confirmConsentRequestProcess() = {
        if (selectedAccountsIbansValue.is.isEmpty) {
          S.error(s"Please select at least 1 account")
        } else {
          val consentId = ObpS.param("CONSENT_ID") openOr ("")
          if (updateConsentPayloadValue.is) {
            updateConsent(
              consentId,
              selectedAccountsIbansValue.is.toList,
              accessBalancesDefinedVar.is,
              accessTransactionsDefinedVar.is
            )
          }
          S.redirectTo(
            s"/confirm-bg-consent-request-sca?CONSENT_ID=${consentId}"
          )
        }
      }
    
      /**
       * Handles the denial of a consent request.
       */
      private def denyConsentRequestProcess() = {
        val consentId = ObpS.param("CONSENT_ID") openOr ("")
        Consents.consentProvider.vend.getConsentByConsentId(consentId) match {
          case Full(consent) if otpValue.is == consent.challenge =>
            updateConsentUser(consent)
            Consents.consentProvider.vend.updateConsentStatus(consentId, ConsentStatus.rejected)
            S.redirectTo(
              s"$redirectUriValue?CONSENT_ID=${consentId}"
            )
          case _ =>
            S.error(ErrorMessages.ConsentNotFound)
        }
    
      }
    
      /**
       * Handles the confirmation of a consent request with SCA (Strong Customer Authentication).
       */
      private def confirmConsentRequestProcessSca() = {
        val consentId = ObpS.param("CONSENT_ID") openOr ("")
        Consents.consentProvider.vend.getConsentByConsentId(consentId) match {
          case Full(consent) if otpValue.is == consent.challenge =>
            updateConsentUser(consent)
            Consents.consentProvider.vend.updateConsentStatus(consentId, ConsentStatus.valid)
            S.redirectTo(
              s"/confirm-bg-consent-request-redirect-uri?CONSENT_ID=${consentId}"
            )
          case _ =>
            S.error(ErrorMessages.OneTimePasswordInvalid)
        }
      }
    
      private def updateConsentUser(consent: MappedConsent): Box[MappedConsent] = {
        val loggedInUser = AuthUser.currentUser.flatMap(_.user.foreign).openOrThrowException(ErrorMessages.AuthenticatedUserIsRequired)
        Consents.consentProvider.vend.updateConsentUser(consent.consentId, loggedInUser)
        val jwt = Consent.updateUserIdOfBerlinGroupConsentJWT(loggedInUser.userId, consent, None).openOrThrowException(ErrorMessages.InvalidConnectorResponse)
        Consents.consentProvider.vend.setJsonWebToken(consent.consentId, jwt)
      }
    
      private def getTppRedirectUri() = {
        val consentId = ObpS.param("CONSENT_ID") openOr ("")
        s"$redirectUriValue?CONSENT_ID=${consentId}"
      }
    
      /**
       * Renders the SCA confirmation form for Berlin Group consent.
       *
       * @return CssSel for rendering the form.
       */
      def confirmBgConsentRequest: CssSel = {
        "#otp-value" #> SHtml.text(otpValue, otpValue(_)) &
          "type=submit" #> SHtml.onSubmitUnit(confirmConsentRequestProcessSca)
      }
    
      /**
       * Renders the TPP Redirect URI  form for Berlin Group consent.
       *
       * @return CssSel for rendering the form.
       */
      def setTppRedirectUri: CssSel = {
        "#confirm-bg-consent-redirect-uri-submit-button a [href]" #> getTppRedirectUri() &
        "#confirm-bg-consent-redirect-uri-submit-button a [data-fallback]" #> tppNokRedirectUriValue.is &
        "#confirm-bg-consent-redirect-uri-text *" #> s"""Consent has been created with success and now the user will be redirected back to his original app ${consumerNameValue.is}"""
    
      }
      
    }
    
    =================
    
    
    obp-api/src/main/scala/code/snippet/ConsentScreen.scala
    
    
    /**
    Open Bank Project - API
    Copyright (C) 2011-2019, TESOBE GmbH.
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH.
    Osloer Strasse 16/17
    Berlin 13359, Germany
    
    This product includes software developed at
    TESOBE (http://www.tesobe.com/)
    
      */
    package code.snippet
    
    import code.api.util.APIUtil.callEndpoint
    import code.api.util.CustomJsonFormats
    import code.api.v5_1_0.OBPAPI5_1_0.Implementations5_1_0
    import code.api.v5_1_0.{ConsentInfoJsonV510, ConsentsInfoJsonV510}
    import code.consumer.Consumers
    import code.model.dataAccess.AuthUser
    import code.util.Helper.{MdcLoggable, ObpS}
    import code.util.HydraUtil.integrateWithHydra
    import net.liftweb.common.Full
    import net.liftweb.http.js.JsCmd
    import net.liftweb.http.js.JsCmds._
    import net.liftweb.http.{DeleteRequest, GetRequest, RequestVar, S, SHtml}
    import net.liftweb.json
    import net.liftweb.json.{Extraction, Formats, JNothing}
    import net.liftweb.util.CssSel
    import net.liftweb.util.Helpers._
    import sh.ory.hydra.api.AdminApi
    import sh.ory.hydra.model.{AcceptConsentRequest, RejectRequest}
    
    import scala.collection.JavaConverters._
    import scala.xml.NodeSeq
    
    
    
    class ConsentScreen extends MdcLoggable {
    
      private object skipConsentScreenVar extends RequestVar(false)
      private object consentChallengeVar extends RequestVar(ObpS.param("consent_challenge").getOrElse(""))
      private object csrfVar extends RequestVar(ObpS.param("_csrf").getOrElse(""))
      implicit val formats: Formats = CustomJsonFormats.formats
      
      def submitAllowAction: Unit = {
        integrateWithHydra match {
          case true if !consentChallengeVar.isEmpty =>
            val acceptConsentRequestBody = new AcceptConsentRequest
            val adminApi: AdminApi = new AdminApi
            acceptConsentRequestBody.setRemember(skipConsentScreenVar.is)
            acceptConsentRequestBody.setRememberFor(0L)
            acceptConsentRequestBody.setGrantScope(List("openid").asJava)
            val completedRequest = adminApi.acceptConsentRequest(consentChallengeVar.is, acceptConsentRequestBody)
            S.redirectTo(completedRequest.getRedirectTo)
          case false =>
            S.redirectTo("/") // Home page
        }
      }
      
      def submitDenyAction: Unit = {
        integrateWithHydra match {
          case true if !consentChallengeVar.isEmpty =>
            val rejectRequestBody = new RejectRequest
            rejectRequestBody.setError("access_denied")
            rejectRequestBody.setErrorDescription("The resource owner denied the request")
            val adminApi: AdminApi = new AdminApi
            val completedRequest = adminApi.rejectConsentRequest(consentChallengeVar.is, rejectRequestBody)
            S.redirectTo("/") // Home page
          case false =>
            S.redirectTo("/") // Home page
        }
      }
      
      def consentScreenForm = {
        val username = AuthUser.getCurrentUser.map(_.name).getOrElse("")
        val adminApi: AdminApi = new AdminApi
        val consumerKey = adminApi.getConsentRequest(consentChallengeVar.is).getClient.getClientId
        val consumerName = Consumers.consumers.vend.getConsumerByConsumerKey(consumerKey).map(_.name.get).getOrElse("Unknown")
        "#username *" #> username &
          "#consumer_description_1 *" #> consumerName &
        "form" #> {
          "#skip_consent_screen_checkbox" #> SHtml.checkbox(skipConsentScreenVar, skipConsentScreenVar(_)) &
            "#allow_access_to_consent" #> SHtml.submit(s"Allow access", () => submitAllowAction) &
            "#deny_access_to_consent" #> SHtml.submit(s"Deny access", () => submitDenyAction)
        }
      }
    
      def getConsents: CssSel = {
        callEndpoint(Implementations5_1_0.getMyConsents, List("my", "consents"), GetRequest) match {
          case Right(response) =>
            tryo(json.parse(response).extract[ConsentsInfoJsonV510]) match {
              case Full(consentsInfoJsonV510) =>
                "#consent-table-body *" #> renderConsentRows(consentsInfoJsonV510.consents) &
                  "#flash-message *" #> NodeSeq.Empty 
              case _ =>
                "#consent-table-body *" #> NodeSeq.Empty &
                  "#flash-message *" #> renderAlert("Failed to parse consent data.", isError = true)
            }
          case Left((msg, _)) =>
            "#consent-table-body *" #> NodeSeq.Empty &
              "#flash-message *" #> renderAlert(msg, isError = true)
        }
      }
    
      private def renderAlert(msg: String, isError: Boolean): NodeSeq = {
        val alertClass = if (isError) "alert-danger" else "alert-success"
        <div class={"alert " + alertClass} role="alert">{msg}</div>
      }
      
      private def callRevokeMyConsent(consentId: String): Either[(String, Int), String] = {
        callEndpoint(Implementations5_1_0.revokeMyConsent, List("my", "consents", consentId), DeleteRequest)
      }
    
      private def refreshTable(): JsCmd = {
        callEndpoint(Implementations5_1_0.getMyConsents, List("my", "consents"), GetRequest) match {
          case Right(response) =>
            tryo(json.parse(response).extract[ConsentsInfoJsonV510]) match {
              case Full(consentsInfoJsonV510) =>
                SetHtml("consent-table-body", renderConsentRows(consentsInfoJsonV510.consents))
              case _ =>
                SetHtml("consent-table-body", <tr><td colspan="6">Error parsing consent data</td></tr>)
            }
          case Left((msg, _)) =>
            SetHtml("consent-table-body", <tr><td colspan="6">{msg}</td></tr>)
        }
      }
    
      private def ShowMessage(msg: String, isError: Boolean): JsCmd = {
        val alertClass = if (isError) "alert-danger" else "alert-success"
        val html = <div class={"alert " + alertClass} role="alert">{msg}</div>
        SetHtml("flash-message", html)
      }
    
      private def renderConsentRows(consents: List[ConsentInfoJsonV510]): NodeSeq = {
        consents.map { consent =>
          <tr class="consent-entry">
            <td class="consent_reference_id">{consent.consent_reference_id}</td>
            <td class="consumer-id">{consent.consumer_id}</td>
            <td class="jwt-payload">{json.prettyRender(consent.jwt_payload.map(Extraction.decompose).openOr(JNothing))}</td>
            <td class="status">{consent.status}</td>
            <td class="api-standard">{consent.api_standard}</td>
            <td>
              {
              SHtml.ajaxButton("Revoke", () => {
                val result = callRevokeMyConsent(consent.consent_id)
                val message = result match {
                  case Left((msg, _)) => ShowMessage(msg, isError = true)
                  case Right(_)       => ShowMessage(s"Consent (reference_id ${consent.consent_reference_id}) successfully revoked.", isError = false)
                }
                message & refreshTable()
              })
              }
            </td>
          </tr>
        }
      }
    }
    
    
    ==============
    
    
    obp-api/src/main/scala/code/snippet/PaymentOTP.scala
    
    
    /**
    Open Bank Project - API
    Copyright (C) 2011-2019, TESOBE GmbH.
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH.
    Osloer Strasse 16/17
    Berlin 13359, Germany
    
    This product includes software developed at
    TESOBE (http://www.tesobe.com/)
    
      */
    package code.snippet
    
    import code.api.berlin.group.v1_3.JSONFactory_BERLIN_GROUP_1_3.StartPaymentAuthorisationJson
    import code.api.builder.PaymentInitiationServicePISApi.APIMethods_PaymentInitiationServicePISApi.{startPaymentAuthorisationUpdatePsuAuthentication, updatePaymentPsuDataTransactionAuthorisation}
    import code.api.util.APIUtil._
    import code.api.util.ErrorMessages.FutureTimeoutException
    import code.api.util.{CallContext, CustomJsonFormats}
    import code.api.v2_1_0.TransactionRequestWithChargeJSON210
    import code.api.v4_0_0.APIMethods400
    import code.model.dataAccess.AuthUser
    import code.util.Helper.{MdcLoggable, ObpS}
    import com.openbankproject.commons.util.ReflectUtils
    import net.liftweb.actor.LAFuture
    import net.liftweb.common.{Empty, Failure, Full}
    import net.liftweb.http.rest.RestHelper
    import net.liftweb.http.{BodyOrInputStream, JsonResponse, LiftResponse, ParamCalcInfo, PostRequest, PutRequest, Req, RequestType, RequestVar, S, SHtml}
    import net.liftweb.json
    import net.liftweb.json.Formats
    import net.liftweb.json.JsonAST.{JObject, JString}
    import net.liftweb.util.Helpers._
    import org.apache.commons.io.IOUtils
    import org.apache.commons.lang3.StringUtils
    
    import scala.util.Either
    import scala.xml.NodeSeq
    
    class PaymentOTP extends MdcLoggable with RestHelper with APIMethods400 {
      protected implicit override def formats: Formats = CustomJsonFormats.formats
    
      private object otpVar extends RequestVar("")
      private object submitButtonDefenseFlag extends RequestVar("")
      
      def validateOTP(in: NodeSeq): NodeSeq = {
    
        def submitButtonDefense: Unit = {
          submitButtonDefenseFlag("true")
        }
    
        val form = "form" #> {
          "#otp_input" #> SHtml.textElem(otpVar) &
            "type=submit" #> SHtml.submit("Submit OTP", () => submitButtonDefense)
        }
    
        def PaymentOTP = {
          val result = ObpS.param("flow") match {
            case Full("payment") => processPaymentOTP
            case Full(unSupportedFlow) => Left((s"flow $unSupportedFlow is not correct.", 500))
            case _ => Left(("request parameter [flow] is mandatory, please add this parameter in url.", 500))
          }
    
          result.map(json.parse(_).extract[StartPaymentAuthorisationJson]) match {
            case Right(v) if (v.scaStatus == "finalised") => {
              "#form_otp" #> "" &
                "#otp-validation-success p *" #> "OTP validation success." &
                "#otp-validation-errors" #> ""
            }
            case Right(v) => {
              form &
                "#otp-validation-success" #> "" &
                "#otp-validation-errors .errorContent *" #> s"Otp validation fail! ${v.psuMessage}"
            }
            case Left((msg, _)) => {
              form &
                "#otp-validation-success" #> "" &
                "#otp-validation-errors .errorContent *" #> s"Otp validation fail! $msg"
            }
          }
        }
        def transactionRequestOTP = {
          val result = ObpS.param("flow") match {
            case Full("transaction_request") => processTransactionRequestOTP
            case Full(unSupportedFlow) => Left((s"flow $unSupportedFlow is not correct.", 500))
            case _ => Left(("request parameter [flow] is mandatory, please add this parameter in url.", 500))
          }
    
          result.map(json.parse(_).extract[TransactionRequestWithChargeJSON210]) match {
            case Right(v) => {
              "#form_otp" #> "" &
                "#otp-validation-success p *" #> "OTP validation success." &
                "#otp-validation-errors" #> ""
            }
            case Left((msg, _)) => {
              form &
                "#otp-validation-success" #> "" &
                "#otp-validation-errors .errorContent *" #> s"Otp validation fail! $msg"
            }
          }
        }
    
        val page = if(S.post_?) {
          if(StringUtils.isBlank(otpVar.get)) {
            form &
              "#otp-validation-success" #> "" &
              "#otp-validation-errors .errorContent *" #> "please input OTP value"
          } else {
            ObpS.param("flow") match {
              case Full("payment") => PaymentOTP
              case Full("transaction_request") => transactionRequestOTP
              case _ => transactionRequestOTP
            }
          }
        }
        else {
          form &
            "#otp-validation-errors" #> "" &
            "#otp-validation-success" #> ""
        }
        page(in)
      }
    
    
      private def processPaymentOTP: Either[(String, Int), String] = {
    
        val requestParam = List(ObpS.param("paymentService"), ObpS.param("paymentProduct"), ObpS.param("paymentId"))
    
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("There are one or many mandatory request parameter not present, please check request parameter: paymentService, paymentProduct, paymentId", 500))
        }
    
        val pathOfEndpoint = requestParam.map(_.openOr("")) :+ "authorisations"
    
        val authorisationsResult = callEndpoint(startPaymentAuthorisationUpdatePsuAuthentication, pathOfEndpoint, PostRequest)
    
        authorisationsResult match {
          case left @Left((_, _)) => left
    
          case Right(v) => {
            val authorisationId = json.parse(v).extract[StartPaymentAuthorisationJson].authorisationId
            val requestBody = s"""{"scaAuthenticationData":"${otpVar.get}"}"""
    
            callEndpoint(updatePaymentPsuDataTransactionAuthorisation, pathOfEndpoint :+ authorisationId, PutRequest, requestBody)
          }
        }
    
    
    
      }
      
      
      private def processTransactionRequestOTP: Either[(String, Int), String] = {
    
        val requestParam = List(
          ObpS.param("id"),
          ObpS.param("bankId"),
          ObpS.param("accountId"),
          ObpS.param("viewId"),
          ObpS.param("transactionRequestType"),
          ObpS.param("transactionRequestId")
        )
    
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("There are one or many mandatory request parameter not present, please check request parameter: bankId, accountId, viewId, transactionRequestType, transactionRequestId", 500))
        }
    
        val pathOfEndpoint = List(
          "banks",
          ObpS.param("bankId")openOr(""),
          "accounts",
          ObpS.param("accountId")openOr(""),
          ObpS.param("viewId")openOr(""),
          "transaction-request-types",
          ObpS.param("transactionRequestType")openOr(""),
          "transaction-requests",
          ObpS.param("transactionRequestId")openOr(""),
          "challenge"
        )
    
        val requestBody = s"""{"id":"${ObpS.param("id").getOrElse("")}","answer":"${otpVar.get}"}"""
    
        val authorisationsResult = callEndpoint(Implementations4_0_0.answerTransactionRequestChallenge, pathOfEndpoint, PostRequest, requestBody)
    
        authorisationsResult
    
      }
    
    }
    
    
    =================
    
    obp-api/src/main/scala/code/snippet/UserOnBoarding.scala
    
    /**
    Open Bank Project - API
    Copyright (C) 2011-2019, TESOBE GmbH.
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH.
    Osloer Strasse 16/17
    Berlin 13359, Germany
    
    This product includes software developed at
    TESOBE (http://www.tesobe.com/)
    
      */
    package code.snippet
    
    import code.api.util.APIUtil._
    import code.api.util.ErrorMessages.InvalidJsonFormat
    import code.api.util.{APIUtil, CustomJsonFormats}
    import code.api.v3_1_0.{APIMethods310, UserAuthContextUpdateJson}
    import code.util.Helper.{MdcLoggable, ObpS}
    import com.openbankproject.commons.model.UserAuthContextUpdateStatus
    import net.liftweb.common.Full
    import net.liftweb.http.rest.RestHelper
    import net.liftweb.http.{PostRequest, RequestVar, S, SHtml}
    import net.liftweb.json.Formats
    import net.liftweb.json
    import net.liftweb.util.Helpers._
    
    import scala.util.Either
    
    class UserOnBoarding extends MdcLoggable with RestHelper with APIMethods310 {
      protected implicit override def formats: Formats = CustomJsonFormats.formats
    
    
      //This key can be set from props, the default in obp code is CUSTOMER_NUMBER
      private object identifierKey extends RequestVar(APIUtil.getPropsValue("default_auth_context_update_request_key", "CUSTOMER_NUMBER"))
      private object identifierValue extends RequestVar("123456")
      private object otpValue extends RequestVar("123456")
    
    
      def addUserAuthContextUpdateRequest = {
        identifierKey.set(ObpS.param("key").openOr(identifierKey.get))
        // CUSTOMER_NUMBER --> Customer Number
        val inputValue = identifierKey.get.split("_").map(_.toLowerCase.capitalize).mkString(" ")
        "#add-user-auth-context-update-request-form-title *" #> s"Please enter your ${inputValue}:" &
        "#identifier-key" #> SHtml.textElem(identifierKey) &
          "#identifier-value" #> SHtml.textElem(identifierValue)  &
          "type=submit" #> SHtml.onSubmitUnit(addUserAuthContextUpdateRequestProcess)
      }
    
      def confirmUserAuthContextUpdateRequest = {
        "#otp-value" #> SHtml.textElem(otpValue) &
          "type=submit" #> SHtml.onSubmitUnit(confirmUserAuthContextUpdateRequestProcess)
      }
    
      private def addUserAuthContextUpdateRequestProcess() ={
    
        callCreateUserAuthContextUpdateRequest match {
          case Left(error) => S.error("identifier-error",error._1)
          case Right(response) => {
            tryo {json.parse(response).extract[UserAuthContextUpdateJson]} match {
              case Full(userAuthContextUpdateJson) => S.redirectTo(
                s"/confirm-user-auth-context-update-request?BANK_ID=${ObpS.param("BANK_ID")openOr("")}&AUTH_CONTEXT_UPDATE_ID=${userAuthContextUpdateJson.user_auth_context_update_id}"
              )
              case _ => S.error("identifier-error",s"$InvalidJsonFormat The Json body should be the $UserAuthContextUpdateJson. " +
                s"Please check `Create User Auth Context Update Request` endpoint separately! ")
            }
          }
        }
        
      }
    
      private def confirmUserAuthContextUpdateRequestProcess() ={
        callConfirmUserAuthContextUpdateRequest match {
          case Left(error) => S.error("otp-value-error",error._1)
          case Right(response) => {
            tryo {json.parse(response).extract[UserAuthContextUpdateJson]} match {
              case Full(userAuthContextUpdateJson) if (userAuthContextUpdateJson.status.equals(UserAuthContextUpdateStatus.ACCEPTED.toString)) =>
                S.redirectTo("/")
              case Full(userAuthContextUpdateJson) => 
                S.error("otp-value-error",s"Current SCA status is ${userAuthContextUpdateJson.status}. Please double check OTP value.")
              case _ => S.error("otp-value-error",s"$InvalidJsonFormat The Json body should be the $UserAuthContextUpdateJson. " +
                s"Please check `Create User Auth Context Update Request` endpoint separately! ")
            }
          }
        }
      }
    
      private def callCreateUserAuthContextUpdateRequest: Either[(String, Int), String] = {
    
        val requestParam = List(
          ObpS.param("BANK_ID"),
          ObpS.param("SCA_METHOD")
        )
    
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("There are one or many mandatory request parameter not present, please check request parameter: BANK_ID, SCA_METHOD", 500))
        }
    
        val pathOfEndpoint = List(
          "banks",
          ObpS.param("BANK_ID")openOr(""),
          "users",
          "current",
          "auth-context-updates",
          ObpS.param("SCA_METHOD")openOr("")
        )
    
        val requestBody = s"""{"key":"${identifierKey.get}","value":"${identifierValue.get}"}"""
        val authorisationsResult = callEndpoint(Implementations3_1_0.createUserAuthContextUpdateRequest, pathOfEndpoint, PostRequest, requestBody)
    
        authorisationsResult
    
      }
    
      private def callConfirmUserAuthContextUpdateRequest: Either[(String, Int), String] = {
    
        val requestParam = List(
          ObpS.param("BANK_ID"),
          ObpS.param("AUTH_CONTEXT_UPDATE_ID")
        )
    
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("There are one or many mandatory request parameter not present, please check request parameter: BANK_ID, AUTH_CONTEXT_UPDATE_ID", 500))
        }
    
        val pathOfEndpoint = List(
          "banks",
          ObpS.param("BANK_ID")openOr(""),
          "users",
          "current",
          "auth-context-updates",
          ObpS.param("AUTH_CONTEXT_UPDATE_ID")openOr(""),
          "challenge"
        )
    
        val requestBody = s"""{"answer":"${otpValue.get}"}"""
        val authorisationsResult = callEndpoint(Implementations3_1_0.answerUserAuthContextUpdateChallenge, pathOfEndpoint, PostRequest, requestBody)
    
        authorisationsResult
    
      }
    
    }
    
    =================
    
    
    obp-api/src/main/scala/code/snippet/VrpConsentCreation.scala
    
    /**
    Open Bank Project - API
    Copyright (C) 2011-2019, TESOBE GmbH.
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH.
    Osloer Strasse 16/17
    Berlin 13359, Germany
    
    This product includes software developed at
    TESOBE (http://www.tesobe.com/)
    
      */
    package code.snippet
    
    import code.api.util.APIUtil._
    import code.api.util.ErrorMessages.InvalidJsonFormat
    import code.api.util.{APIUtil, CustomJsonFormats, DateTimeUtil}
    import code.api.v5_1_0.{APIMethods510, ConsentJsonV510}
    import code.api.v5_0_0.{APIMethods500, ConsentJsonV500, ConsentRequestResponseJson}
    import code.api.v3_1_0.{APIMethods310, ConsentChallengeJsonV310, ConsumerJsonV310}
    import code.consent.ConsentStatus
    import code.consumer.Consumers
    import code.model.dataAccess.AuthUser
    import code.util.Helper.{MdcLoggable, ObpS}
    import net.liftweb.common.Full
    import net.liftweb.http.rest.RestHelper
    import net.liftweb.http.{GetRequest, PostRequest, RequestVar, S, SHtml, SessionVar}
    import net.liftweb.json
    import net.liftweb.json.Formats
    import net.liftweb.util.CssSel
    import net.liftweb.util.Helpers._
    
    class VrpConsentCreation extends MdcLoggable with RestHelper with APIMethods510 with APIMethods500 with APIMethods310 {
      protected implicit override def formats: Formats = CustomJsonFormats.formats
    
      private object otpValue extends RequestVar("123456")
      private object consentRequestIdValue extends SessionVar("")
    
      def confirmVrpConsentRequest = {
        getConsentRequest match {
          case Left(error) => {
            S.error(error._1)
            "#confirm-vrp-consent-request-form-title *" #> s"Please confirm or deny the following consent request:" &
              "#confirm-vrp-consent-request-response-json *" #> s"""""" &
              "type=submit" #> ""
          }
          case Right(response) => {
            tryo {json.parse(response).extract[ConsentRequestResponseJson]} match {
              case Full(consentRequestResponseJson) =>
                val jsonAst = consentRequestResponseJson.payload
                val currency = (jsonAst \ "to_account" \ "limit" \ "currency").extract[String]
                val ttl: Long = (jsonAst \ "time_to_live").extract[Long]
                val consumer = Consumers.consumers.vend.getConsumerByConsumerId(consentRequestResponseJson.consumer_id)
                val formText =
                  s"""I, ${AuthUser.currentUser.map(_.firstName.get).getOrElse("")} ${AuthUser.currentUser.map(_.lastName.get).getOrElse("")}, consent to the service provider ${consumer.map(_.name.get).getOrElse("")} making transfers on my behalf from my bank account number ${(jsonAst \ "from_account" \ "account_routing" \ "address").extract[String]}, to the beneficiary ${(jsonAst \ "to_account" \ "counterparty_name").extract[String]}, account number ${(jsonAst \ "to_account" \ "account_routing" \ "address").extract[String]} at bank code ${(jsonAst \ "to_account" \ "bank_routing" \ "address").extract[String]}.
                  |
                  |The transfers governed by this consent must respect the following rules:
                  |
                  |  1) The grand total amount will not exceed $currency ${(jsonAst \ "to_account" \ "limit" \ "max_total_amount").extract[String]}.
                  |  2) Any single amount will not exceed $currency ${(jsonAst \ "to_account" \ "limit" \ "max_single_amount").extract[String]}.
                  |  3) The maximum amount per month that can be transferred is $currency ${(jsonAst \ "to_account" \ "limit" \ "max_monthly_amount").extract[String]} over ${(jsonAst \ "to_account" \ "limit" \ "max_number_of_monthly_transactions").extract[String]} transactions.
                  |  4) The maximum amount per year that can be transferred is $currency ${(jsonAst \ "to_account" \ "limit" \ "max_yearly_amount").extract[String]} over ${(jsonAst \ "to_account" \ "limit" \ "max_number_of_yearly_transactions").extract[String]} transactions.
                  |
                  |This consent will start on date ${(jsonAst \ "valid_from").extract[String].replace("T"," ").replace("Z","")} and be valid for ${DateTimeUtil.formatDuration(ttl)}.
                  |
                  |I understand that I can revoke this consent at any time.
                  |""".stripMargin
    
    
                "#confirm-vrp-consent-request-form-title *" #> s"Please confirm or deny the following consent request:" &
                "#confirm-vrp-consent-request-form-text *" #> s"""$formText""" &
                "#from_bank_routing_scheme [value]" #> s"${(jsonAst \ "from_account" \ "bank_routing" \ "scheme").extract[String]}" &
                "#from_bank_routing_address [value]" #> s"${(jsonAst \ "from_account" \ "bank_routing" \ "address").extract[String]}" &
                "#from_branch_routing_scheme [value]" #> s"${(jsonAst \ "from_account" \ "branch_routing" \ "scheme").extract[String]}" &
                "#from_branch_routing_address [value]" #> s"${(jsonAst \ "from_account" \ "branch_routing" \ "address").extract[String]}" &
                "#from_routing_scheme [value]" #> s"${(jsonAst \ "from_account" \ "account_routing" \ "scheme").extract[String]}" &
                "#from_routing_address [value]" #> s"${(jsonAst \ "from_account" \ "account_routing" \ "address").extract[String]}" &
                "#to_bank_routing_scheme [value]" #> s"${(jsonAst \ "to_account" \ "bank_routing" \ "scheme").extract[String]}" &
                "#to_bank_routing_address [value]" #> s"${(jsonAst \ "to_account" \ "bank_routing" \ "address").extract[String]}" &
                "#to_branch_routing_scheme [value]" #> s"${(jsonAst \ "to_account" \ "branch_routing" \ "scheme").extract[String]}" &
                "#to_branch_routing_address [value]" #> s"${(jsonAst \ "to_account" \ "branch_routing" \ "address").extract[String]}" &
                "#to_routing_scheme [value]" #> s"${(jsonAst \ "to_account" \ "account_routing" \ "scheme").extract[String]}" &
                "#to_routing_address [value]" #> s"${(jsonAst \ "to_account" \ "account_routing" \ "address").extract[String]}" &
                "#counterparty_name [value]" #> s"${(jsonAst \ "to_account" \ "counterparty_name").extract[String]}" &
                "#currency [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "currency").extract[String]}" &
                "#max_single_amount [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_single_amount").extract[String]}" &
                "#max_monthly_amount [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_monthly_amount").extract[String]}" &
                "#max_yearly_amount [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_yearly_amount").extract[String]}" &
                "#max_total_amount [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_total_amount").extract[String]}" &
                "#max_number_of_monthly_transactions [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_number_of_monthly_transactions").extract[String]}" &
                "#max_number_of_yearly_transactions [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_number_of_yearly_transactions").extract[String]}" &
                "#max_number_of_transactions [value]" #> s"${(jsonAst \ "to_account" \ "limit" \ "max_number_of_transactions").extract[String]}" &
                "#time_to_live_in_seconds [value]" #> s"${(jsonAst \ "time_to_live").extract[String]}" &
                "#valid_from [value]" #> s"${(jsonAst \ "valid_from").extract[String]}" &
                "#email [value]" #> s"${(jsonAst \ "email").extract[String]}" &
                "#phone_number [value]" #> s"${(jsonAst \ "phone_number").extract[String]}" &
                  showHideElements &
                "#confirm-vrp-consent-request-confirm-submit-button" #> SHtml.onSubmitUnit(confirmConsentRequestProcess)
              case _ =>
                "#confirm-vrp-consent-request-form-title *" #> s"Please confirm or deny the following consent request:" &
                "#confirm-vrp-consent-request-form-title *" #> s"Please confirm or deny the following consent request:" &
                  "#confirm-vrp-consent-request-response-json *" #>
                    s"""$InvalidJsonFormat The Json body should be the $ConsentRequestResponseJson. 
                       |Please check `Get Consent Request` endpoint separately! """.stripMargin &
                  "type=submit" #> ""
            }
          }
        }
        
      }
    
      def showHideElements: CssSel = {
        if (ObpS.param("format").isEmpty) {
          "#confirm-vrp-consent-request-form-text-div [style]" #> "display:block" &
          "#confirm-vrp-consent-request-form-fields [style]" #> "display:none"
        } else if(ObpS.param("format").contains("1")) {
          "#confirm-vrp-consent-request-form-text-div [style]" #> "display:none" &
          "#confirm-vrp-consent-request-form-fields [style]" #> "display:block"
        } else if(ObpS.param("format").contains("2")) {
          "#confirm-vrp-consent-request-form-text-div [style]" #> "display:block" &
          "#confirm-vrp-consent-request-form-fields [style]" #> "display:none"
        }  else if(ObpS.param("format").contains("3")) {
          "#confirm-vrp-consent-request-form-text-div [style]" #> "display:block" &
          "#confirm-vrp-consent-request-form-fields [style]" #> "display:block"
        } else {
          "#confirm-vrp-consent-request-form-text-div [style]" #> "display:block" &
          "#confirm-vrp-consent-request-form-fields [style]" #> "display:none"
        }
      }
      
      def confirmVrpConsent = {
        "#otp-value" #> SHtml.textElem(otpValue) &
          "type=submit" #> SHtml.onSubmitUnit(confirmVrpConsentProcess)
      }
      
      private def confirmConsentRequestProcess() ={
        //1st: we need to call `Create Consent By CONSENT_REQUEST_ID (IMPLICIT)`, this will send OTP to account owner.
        callCreateConsentByConsentRequestIdImplicit match {
          case Left(error) => {
            S.error(error._1)
          }
          case Right(response) => {
            tryo {json.parse(response).extract[ConsentJsonV500]} match {
              case Full(consentJsonV500) =>
                //2nd: we need to redirect to confirm page to fill the OTP
                S.redirectTo(
                  s"/confirm-vrp-consent?CONSENT_ID=${consentJsonV500.consent_id}"
                )
              case _ =>
                S.error(s"$InvalidJsonFormat The Json body should be the $ConsentJsonV500. " +
                  s"Please check `Create Consent By CONSENT_REQUEST_ID (IMPLICIT) !")
            }
          }
        }
      }
    
      private def callAnswerConsentChallenge: Either[(String, Int), String] = {
    
        val requestParam = List(
          ObpS.param("CONSENT_ID")
        )
    
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("There are one or many mandatory request parameter not present, please check request parameter: CONSENT_ID", 500))
        }
    
        val pathOfEndpoint = List(
          "banks",
          APIUtil.defaultBankId,//we do not need to get this from URL, it will be easier for the developer.
          "consents",
          ObpS.param("CONSENT_ID")openOr(""),
          "challenge"
        )
    
        val requestBody = s"""{"answer":"${otpValue.get}"}"""
        val authorisationsResult = callEndpoint(Implementations3_1_0.answerConsentChallenge, pathOfEndpoint, PostRequest, requestBody)
    
        authorisationsResult
    
      }
      
      private def callGetConsentByConsentId(consentId: String): Either[(String, Int), String] = {
        
        val pathOfEndpoint = List(
          "user",
          "current",
          "consents",
          consentId,
        )
    
        val authorisationsResult = callEndpoint(Implementations5_1_0.getConsentByConsentId, pathOfEndpoint, GetRequest)
    
        authorisationsResult
      }
      
      private def callGetConsumer(consumerId: String): Either[(String, Int), String] = {
        
        val pathOfEndpoint = List(
          "management",
          "consumers",
          consumerId,
        )
    
        val authorisationsResult = callEndpoint(Implementations5_1_0.getConsumer, pathOfEndpoint, GetRequest)
    
        authorisationsResult
      }
      
      private def callCreateConsentByConsentRequestIdImplicit: Either[(String, Int), String] = {
    
        val requestParam = List(
          ObpS.param("CONSENT_REQUEST_ID"),
        )
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("Parameter CONSENT_REQUEST_ID is missing, please set it in the URL", 500))
        }
        
        val pathOfEndpoint = List(
          "consumer",
          "consent-requests",
          ObpS.param("CONSENT_REQUEST_ID")openOr(""),
          "IMPLICIT",
          "consents",
        )
    
        val requestBody = s"""{}"""
        val authorisationsResult = callEndpoint(Implementations5_0_0.createConsentByConsentRequestIdImplicit, pathOfEndpoint, PostRequest, requestBody)
    
        authorisationsResult
      }
      
      private def confirmVrpConsentProcess() ={
        //1st: we need to answer challenge and create the consent properly.
        callAnswerConsentChallenge match {
          case Left(error) => S.error(error._1)
          case Right(response) => {
            tryo {json.parse(response).extract[ConsentChallengeJsonV310]} match {
              case Full(consentChallengeJsonV310) if (consentChallengeJsonV310.status.equals(ConsentStatus.ACCEPTED.toString)) =>
                //2nd: we need to call getConsent by consentId --> get the consumerId
                callGetConsentByConsentId(consentChallengeJsonV310.consent_id)  match {
                  case Left(error) => S.error(error._1)
                  case Right(response) => {
                    tryo {json.parse(response).extract[ConsentJsonV510]} match {
                      case Full(consentJsonV510) =>
                        //3rd: get consumer by consumerId
                        callGetConsumer(consentJsonV510.consumer_id)  match {
                          case Left(error) => S.error(error._1)
                          case Right(response) => {
                            tryo {json.parse(response).extract[ConsumerJsonV310]} match {
                              case Full(consumerJsonV310) =>
                                //4th: get the redirect url.
                                val redirectURL = consumerJsonV310.redirect_url.trim
                                S.redirectTo(s"$redirectURL?CONSENT_REQUEST_ID=${consentJsonV510.consent_request_id.getOrElse("")}&status=${consentJsonV510.status}")
                              case _ =>
                                S.error(s"$InvalidJsonFormat The Json body should be the $ConsumerJsonV310. " +
                                  s"Please check `Get Consumer` !")
                            }
                          }
                        }
                        
                      case _ =>
                        S.error(s"$InvalidJsonFormat The Json body should be the $ConsentJsonV510. " +
                          s"Please check `Get Consent By Consent Id` !")
                    }
                  }
                }
              case Full(consentChallengeJsonV310) =>
                S.error(s"Current SCA status is ${consentChallengeJsonV310.status}. Please double check OTP value.")
              case _ => S.error(s"$InvalidJsonFormat The Json body should be the $ConsentChallengeJsonV310. " +
                s"Please check `Answer Consent Challenge` ! ")
            }
          }
        }
      }
    
      private def getConsentRequest: Either[(String, Int), String] = {
    
        val requestParam = List(
          ObpS.param("CONSENT_REQUEST_ID"),
        )
    
        if(requestParam.count(_.isDefined) < requestParam.size) {
          return Left(("Parameter CONSENT_REQUEST_ID is missing, please set it in the URL", 500))
        }
    
        val consentRequestId = ObpS.param("CONSENT_REQUEST_ID")openOr("")
        consentRequestIdValue.set(consentRequestId)
    
        val pathOfEndpoint = List(
          "consumer",
          "consent-requests",
          consentRequestId
        )
    
        val authorisationsResult = callEndpoint(Implementations5_0_0.getConsentRequest, pathOfEndpoint, GetRequest)
    
        authorisationsResult
      }
      
    }
    
    
    ================
    
    obp-api/src/main/webapp/add-user-auth-context-update-request.html
    
    <!--
    Open Bank Project - API
    Copyright (C) 2011-2017, TESOBE GmbH
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANT
    
    
    ================
    
    obp-api/src/main/webapp/confirm-bg-consent-request-redirect-uri.html
    
    <!--
    Open Bank Project - API
    Copyright (C) 2011-2017, TESOBE GmbH
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH
    Osloerstrasse 16/17
    Berlin 13359, Germany
    
      This product includes software developed at
      TESOBE (http://www.tesobe.com/)
      by
      Simon Redfern : simon AT tesobe DOT com
      Sebastian Henschel : sebastian AT tesobe DOT com
    -->
    
    <div data-lift="surround?with=default;at=content">
        <div id="confirm-bg-consent-request-sca" data-lift="BerlinGroupConsent.setTppRedirectUri">
            <form class="login" method="post">
                <div class="form-group">
                    <h3>TPP redirection</h3>
                    <p id="confirm-bg-consent-redirect-uri-text"></p>
                </div>
    
                <div class="row">
                    <a
                            id="confirm-bg-consent-redirect-uri-submit-button"
                            class="btn btn-danger"
                            href=""
                            data-fallback="/"
                    >
                        Ok
                    </a>
    
                    <script>
                        document
                          .getElementById("confirm-bg-consent-redirect-uri-submit-button")
                          .addEventListener("click", function (e) {
                            e.preventDefault();
    
                            const appLink = this.getAttribute("href");
                            const fallbackLink = this.getAttribute("data-fallback");
                            console.log(fallbackLink)
    
                            // Attempt to open the app
                            window.location.href = appLink;
    
                            // Fallback if app is not installed
                            setTimeout(function () {
                              window.location.href = fallbackLink;
                            }, 2000);
                          });
                    </script>
    
                </div>
                <br>
    
            </form>
        </div>
    </div>

    
    
    =====================
    
    
    obp-api/src/main/webapp/confirm-bg-consent-request-sca.html
    
    <!--
    Open Bank Project - API
    Copyright (C) 2011-2017, TESOBE GmbH
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH
    Osloerstrasse 16/17
    Berlin 13359, Germany
    
      This product includes software developed at
      TESOBE (http://www.tesobe.com/)
      by
      Simon Redfern : simon AT tesobe DOT com
      Sebastian Henschel : sebastian AT tesobe DOT com
    -->
    
    <div data-lift="surround?with=default;at=content">
        <div id="confirm-bg-consent-request-sca" data-lift="BerlinGroupConsent.confirmBgConsentRequest">
            <form class="login" method="post">
                <div class="form-group">
                    <h3>Please enter the One Time Password (OTP) that we just sent to you</h3>
                    <p>Please check your phone or email for the value to enter.</p>
                    <input class="form-control" id="otp-value" type="text" value="123" tabindex="0" autofocus
                           autocomplete="off" aria-label="One Time Password"/>
                </div>
    
                <div class="row">
                    <input id="authorise-submit-button" class="btn btn-danger pull-right" type="submit" value="Submit"
                           tabindex="0"/>
                </div>
                <br>
    
            </form>
        </div>
    </div>
    
    ===============
    
    
    obp-api/src/main/webapp/confirm-bg-consent-request.html
    
    
    <!--
    Open Bank Project - API
    Copyright (C) 2011-2025, TESOBE GmbH
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.
    
    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Email: contact@tesobe.com
    TESOBE GmbH
    Osloerstrasse 16/17
    Berlin 13359, Germany
    
      This product includes software developed at
      TESOBE (http://www.tesobe.com/)
      by
      Hongwei Zhang : Hongwei AT tesobe DOT com
      
    -->
    
    <div data-lift="surround?with=default;at=content">
        <div id="confirm-bg-consent-request" style="width: 90%; margin: 0 auto;" data-lift="BerlinGroupConsent.confirmBerlinGroupConsentRequest">
            <div class="form-group">
                <h3 id="confirm-bg-consent-request-form-title">Please check the Berlin Group Consent Request: </h3>
                <div id="confirm-bg-consent-request-form-text-div">
                    <div id="confirm-bg-consent-request-form-text"></div>
                </div>
            </div>
            <form method="post">
    
                <div class="row">
                    <a id="confirm-bg-consent-request-deny-submit-button" class="btn btn-danger"  href="/">Deny</span></a>
                    <input id="confirm-bg-consent-request-confirm-submit-button" class="btn btn-danger" type="submit" value="Confirm"
                           tabindex="0"/>
                </div>
                <br>
    
                <style>
                    pre {
                      white-space: pre-wrap;  /* Preserve whitespace and wrap at spaces */
                      word-break: normal;     /* Prevent breaking words */
                      overflow-wrap: normal;  /* Prevent breaking words */
                      overflow-x: auto;       /* Allow horizontal scrolling if necessary */
                    }
                </style>
            </form>
        </div>
    </div>
    
    
    ==============
    
    obp-api/src/main/webapp/confirm-user-auth-context-update-request.html
    
    
    obp-api/src/main/webapp/confirm-vrp-consent-request.html
    
    obp-api/src/main/webapp/confirm-vrp-consent.html
    
    obp-api/src/main/webapp/confirm-vrp-consent.html
    
    obp-api/src/main/webapp/consent-screen.html
    
    obp-api/src/main/webapp/consents.html
    
    obp-api/src/main/webapp/otp.html
    
    obp-api/src/main/webapp/user-invitation-info.html
    
    obp-api/src/main/webapp/user-invitation-warning.html
    
    obp-api/src/main/webapp/user-invitation.html
