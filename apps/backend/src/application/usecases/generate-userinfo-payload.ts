import { MyinfoPerson } from '../../core/domain/myinfo-person';
import { CryptoService } from '../../core/domain/crypto_service';
import { mapMyinfoProfile } from '../mappers/myinfo-mapper';
import type { JWK } from 'jose';

/**
 * Handles signing (JWS) and encryption (JWE) of the Userinfo response.
 */
export class GenerateUserInfoPayloadUseCase {
  constructor(
    private cryptoService: CryptoService
  ) {}

  async execute(
    person: MyinfoPerson, 
    clientPublicKey: JWK, 
    issuer: string, 
    clientId: string
  ): Promise<string> {
    // 1. Map Myinfo domain entity to the person_info format (with nested { value: ... } objects)
    const personInfo = mapMyinfoProfile(person);
    
    // 2. Construct the OIDC Userinfo claims payload
    const payload = {
      sub: person.userId,
      iss: issuer,
      aud: clientId,
      iat: Math.floor(Date.now() / 1000),
      person_info: personInfo
    };

    // 3. Perform Signed-then-Encrypted (JWS-in-JWE) transformation
    return await this.cryptoService.signAndEncrypt(payload, clientPublicKey);
  }
}
