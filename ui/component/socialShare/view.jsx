// @flow
import * as ICONS from 'constants/icons';
import React from 'react';
import Button from 'component/button';
import CopyableText from 'component/copyableText';
import EmbedTextArea from 'component/embedTextArea';
import { generateDownloadUrl } from 'util/web';
import { useIsMobile } from 'effects/use-screensize';
import { FormField } from 'component/common/form';
import { hmsToSeconds, secondsToHms } from 'util/time';
import { generateLbryContentUrl, generateLbryWebUrl, generateEncodedLbryURL, generateShareUrl } from 'util/url';
import { URL, TWITTER_ACCOUNT, SHARE_DOMAIN_URL } from 'config';

const SHARE_DOMAIN = SHARE_DOMAIN_URL || URL;
const IOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
const SUPPORTS_SHARE_API = typeof navigator.share !== 'undefined';

// Twitter share
const TWITTER_INTENT_API = 'https://twitter.com/intent/tweet?';

type Props = {
  claim: StreamClaim,
  title: ?string,
  webShareable: boolean,
  position: number,
  collectionId?: number,
  customShareUrlEnabled: boolean,
  customShareUrl: string,
};

function SocialShare(props: Props) {
  const { claim, title, webShareable, position, collectionId, customShareUrlEnabled, customShareUrl } = props;
  const [showEmbed, setShowEmbed] = React.useState(false);
  const [includeCollectionId, setIncludeCollectionId] = React.useState(Boolean(collectionId)); // unless it *is* a collection?
  const [showClaimLinks, setShowClaimLinks] = React.useState(false);
  const [includeStartTime, setincludeStartTime]: [boolean, any] = React.useState(false);
  const [startTime, setStartTime]: [string, any] = React.useState(secondsToHms(position));
  const startTimeSeconds: number = hmsToSeconds(startTime);
  const isMobile = useIsMobile();
  const shareDomain = customShareUrlEnabled && customShareUrl ? customShareUrl : SHARE_DOMAIN;

  if (!claim) {
    return null;
  }

  const { canonical_url: canonicalUrl, permanent_url: permanentUrl, name, claim_id: claimId } = claim;
  const isChannel = claim.value_type === 'channel';
  const isCollection = claim.value_type === 'collection';
  const isStream = claim.value_type === 'stream';
  const isVideo = isStream && claim.value.stream_type === 'video';
  const isAudio = isStream && claim.value.stream_type === 'audio';
  const showStartAt = isVideo || isAudio;
  const lbryUrl: string = generateLbryContentUrl(canonicalUrl, permanentUrl);
  const lbryWebUrl: string = generateLbryWebUrl(lbryUrl);
  const includedCollectionId = collectionId && includeCollectionId ? collectionId : null;
  const encodedLbryURL: string = generateEncodedLbryURL(
    shareDomain,
    lbryWebUrl,
    includeStartTime,
    startTimeSeconds,
    includedCollectionId
  );
  const shareUrl: string = generateShareUrl(
    shareDomain,
    lbryUrl,
    null,
    null,
    includeStartTime,
    startTimeSeconds,
    includedCollectionId
  );
  const downloadUrl = `${generateDownloadUrl(name, claimId)}`;

  // Tweet params
  let tweetIntentParams = {
    url: shareUrl,
    text: title || claim.name,
    hashtags: 'LBRY',
  };

  if (TWITTER_ACCOUNT) {
    // $FlowFixMe
    tweetIntentParams.via = TWITTER_ACCOUNT;
  }

  // Generate twitter web intent url
  const tweetIntent = TWITTER_INTENT_API + new URLSearchParams(tweetIntentParams).toString();

  function handleWebShareClick() {
    if (navigator.share) {
      navigator.share({
        title: title || claim.name,
        url: window.location.href,
      });
    }
  }

  return (
    <React.Fragment>
      <CopyableText copyable={shareUrl} />
      {showStartAt && (
        <div className="section__checkbox">
          <FormField
            type="checkbox"
            name="share_start_at_checkbox"
            onChange={() => setincludeStartTime(!includeStartTime)}
            checked={includeStartTime}
            label={__('Start at')}
          />
          <FormField
            type="text"
            name="share_start_at"
            value={startTime}
            disabled={!includeStartTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>
      )}
      {Boolean(collectionId) && (
        <div className="section__checkbox">
          <FormField
            type="checkbox"
            name="share_collection_id_checkbox"
            onChange={() => setIncludeCollectionId(!includeCollectionId)}
            checked={includeCollectionId}
            label={__('Include List ID')}
          />
        </div>
      )}
      <div className="section__actions">
        <Button
          className="share"
          iconSize={24}
          icon={ICONS.TWITTER}
          title={__('Share on Twitter')}
          href={tweetIntent}
        />
        <Button
          className="share"
          iconSize={24}
          icon={ICONS.REDDIT}
          title={__('Share on Reddit')}
          href={`https://reddit.com/submit?url=${encodedLbryURL}`}
        />
        {IOS && (
          // Only ios client supports share urls
          <Button
            className="share"
            iconSize={24}
            icon={ICONS.TELEGRAM}
            title={__('Share on Telegram')}
            href={`tg://msg_url?url=${encodedLbryURL}&amp;text=text`}
          />
        )}
        <Button
          className="share"
          iconSize={24}
          icon={ICONS.LINKEDIN}
          title={__('Share on LinkedIn')}
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedLbryURL}`}
        />
        <Button
          className="share"
          iconSize={24}
          icon={ICONS.FACEBOOK}
          title={__('Share on Facebook')}
          href={`https://facebook.com/sharer/sharer.php?u=${encodedLbryURL}`}
        />
        {webShareable && !isCollection && !isChannel && (
          <Button
            className="share"
            iconSize={24}
            icon={ICONS.EMBED}
            title={__('Embed this content')}
            onClick={() => {
              setShowEmbed(!showEmbed);
              setShowClaimLinks(false);
            }}
          />
        )}
        <Button
          className="share"
          iconSize={24}
          icon={ICONS.SHARE_LINK}
          title={__('Links')}
          onClick={() => {
            setShowClaimLinks(!showClaimLinks);
            setShowEmbed(false);
          }}
        />
      </div>

      {SUPPORTS_SHARE_API && isMobile && (
        <div className="section__actions">
          <Button icon={ICONS.SHARE} button="primary" label={__('Share via...')} onClick={handleWebShareClick} />
        </div>
      )}
      {showEmbed && (
        <EmbedTextArea
          label={__('Embedded')}
          claim={claim}
          includeStartTime={includeStartTime}
          startTime={startTimeSeconds}
        />
      )}
      {showClaimLinks && (
        <div className="section">
          <CopyableText label={__('LBRY URL')} copyable={`lbry://${lbryUrl}`} />
          {Boolean(isStream) && <CopyableText label={__('Download Link')} copyable={downloadUrl} />}
        </div>
      )}
    </React.Fragment>
  );
}

export default SocialShare;
