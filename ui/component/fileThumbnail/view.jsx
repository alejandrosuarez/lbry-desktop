// @flow
import type { Node } from 'react';
import { getThumbnailCdnUrl } from 'util/thumbnail';
import React from 'react';
import FreezeframeWrapper from './FreezeframeWrapper';
import Placeholder from './placeholder.png';
import { MISSING_THUMB_DEFAULT } from 'config';
import classnames from 'classnames';
import Thumb from './thumb';

type Props = {
  uri: string,
  thumbnail: ?string, // externally sourced image
  children?: Node,
  allowGifs: boolean,
  claim: ?StreamClaim,
  doResolveUri: (string) => void,
  className?: string,
  watchedPercentage: number,
  showPercentage: boolean,
};

function FileThumbnail(props: Props) {
  const {
    claim,
    uri,
    doResolveUri,
    thumbnail: rawThumbnail,
    children,
    allowGifs = false,
    className,
    watchedPercentage,
    showPercentage,
  } = props;

  const passedThumbnail = rawThumbnail && rawThumbnail.trim().replace(/^http:\/\//i, 'https://');
  const thumbnailFromClaim =
    uri && claim && claim.value && claim.value.thumbnail ? claim.value.thumbnail.url : undefined;
  const thumbnail = passedThumbnail || thumbnailFromClaim;

  const hasResolvedClaim = claim !== undefined;
  const isGif = thumbnail && thumbnail.endsWith('gif');

  const viewedBar = showPercentage && watchedPercentage && (
    <div className="file-thumbnail__viewed-bar">
      <div className="file-thumbnail__viewed-bar-progress" style={{ width: `${watchedPercentage}%` }} />
    </div>
  );

  React.useEffect(() => {
    if (!hasResolvedClaim && uri) {
      doResolveUri(uri);
    }
  }, [hasResolvedClaim, uri, doResolveUri]);

  if (!allowGifs && isGif) {
    return (
      <FreezeframeWrapper src={thumbnail} className={classnames('media__thumb', className)}>
        {children}
        {viewedBar}
      </FreezeframeWrapper>
    );
  }

  const fallback = MISSING_THUMB_DEFAULT ? getThumbnailCdnUrl({ thumbnail: MISSING_THUMB_DEFAULT }) : undefined;

  let url = thumbnail || (hasResolvedClaim ? Placeholder : '');
  // @if TARGET='web'
  // Pass image urls through a compression proxy
  if (thumbnail && !(isGif && allowGifs)) {
    url = getThumbnailCdnUrl({ thumbnail });
  }
  // @endif

  const thumbnailUrl = url ? url.replace(/'/g, "\\'") : '';

  if (hasResolvedClaim || thumbnailUrl) {
    return (
      <Thumb thumb={thumbnailUrl} fallback={fallback} className={className}>
        {children}
        {viewedBar}
      </Thumb>
    );
  }
  return (
    <div
      className={classnames('media__thumb', className, {
        'media__thumb--resolving': !hasResolvedClaim,
      })}
    >
      {children}
      {viewedBar}
    </div>
  );
}

export default FileThumbnail;
