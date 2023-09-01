import { CSSProperties, ReactNode, SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

const preloadSize = 1000;

export interface Tile {
  left: number;
  top: number;
  key: string | number;
  content: ReactNode;
}

export interface VirtualCanvasProps {
  contentWidth: number;
  contentHeight: number;
  tiles: Tile[];
}

// #region Styles
const mainDivStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "scroll",
    border: 'solid blue 1px'
};

const scrollDivStyle: CSSProperties = {
    position: "absolute",
    left: "0px",
    top: "0px",
    border: 'solid yellow 1px'
};

const wrapperStyle: CSSProperties = {
    display: 'flex',
    position: "sticky",
    left: "0px",
    top: "0px",
    width: "100%",
    height: "100%",
    border: 'solid red 1px'
};

function contentStyle(contentHeight: number, contentWidth: number): CSSProperties {
    return {
        height: `${contentHeight}px`,
        display: 'flex',
        width: `${contentWidth}px`
    }
};

function imagesContainerStyle(tile: Tile): CSSProperties {
    return {
        position: "absolute",
        top: `${tile.top}px`,
        left: `${tile.left}px`
    }
}
// #endregion

export function VirtualCanvas({ contentWidth, contentHeight, tiles }: VirtualCanvasProps) {
    const mainDivRef = useRef<HTMLDivElement>(null);
    const scrollDivRef = useRef<HTMLDivElement>(null);
    const TransformWrapperRef = useRef<ReactZoomPanPinchRef>(null);

    const [visibleTiles, setVisibleTiles] = useState<Tile[]>([]);

    useEffect(() => {
        const wrapper = mainDivRef.current;

        if (wrapper) {
          const observer = new ResizeObserver(() => {
            if (TransformWrapperRef.current)
                TransformWrapperRef.current.zoomIn(0, 0, undefined);
          });

          observer.observe(wrapper);

          return () => {
            observer.disconnect();
          };
        }
    }, [scrollDivRef,TransformWrapperRef]);

    const onScroll = (event: SyntheticEvent<HTMLDivElement>) => {
        if (TransformWrapperRef.current) {
            const currentPositionX = Math.round(event.currentTarget.scrollLeft);
            const currentPositionY = Math.round(event.currentTarget.scrollTop)
            const prevPositionX = Math.round(-TransformWrapperRef.current.instance.transformState.positionX);
            const prevPositionY = Math.round(-TransformWrapperRef.current.instance.transformState.positionY);

            if (prevPositionX !== currentPositionX || prevPositionY !== currentPositionY) {
                const newPositionX = prevPositionX < 0 ? -prevPositionX : -currentPositionX;
                TransformWrapperRef.current.setTransform(newPositionX, -currentPositionY, TransformWrapperRef.current.instance.transformState.scale, 0, undefined);
            }
        }
    };

    const onTransformed = useCallback((ref: ReactZoomPanPinchRef) => {
        const wrapper = ref.instance.wrapperComponent;
        const transformState = ref.instance.transformState;

        if (wrapper) {
            const scale = transformState.scale;
            const left = -transformState.positionX;
            const top = -transformState.positionY / scale;
            const width = wrapper.clientWidth / scale;
            const height = wrapper.clientHeight / scale;

            const updateVisibleTiles = tiles.filter(tile =>
                tile.top < top + height + preloadSize &&
                tile.left < left + width + preloadSize
            );

            setVisibleTiles(visibleTiles => {
                if (updateVisibleTiles.length !== visibleTiles.length)
                    return updateVisibleTiles;

                for (let i = 0; i < visibleTiles.length; i++)
                    return updateVisibleTiles;

                return visibleTiles;
            });

            if (mainDivRef.current && scrollDivRef.current) {
                scrollDivRef.current.style.width = `${contentWidth*scale}px`;
                scrollDivRef.current.style.height = `${contentHeight*scale}px`;
                mainDivRef.current.scrollLeft = -transformState.positionX;
                mainDivRef.current.scrollTop = -transformState.positionY;
            }
        }
    }, [contentWidth, contentHeight, tiles]);

    const transformWrapperProps = {
        maxScale: 2,
        minScale: 0.1,
        initialScale: 1,
        limitToBounds: true,
        disablePadding: true,
        wheel: {
            activationKeys: ["Control"]
        },
        panning: {
            disabled: true
        }
    };

    return (
        <div style={ mainDivStyle } onScroll={ onScroll } ref={ mainDivRef }>
            <div style={ scrollDivStyle } ref={ scrollDivRef } />
            <TransformWrapper
                minScale={ transformWrapperProps.minScale }
                initialScale={ transformWrapperProps.initialScale }
                maxScale={ transformWrapperProps.maxScale }
                limitToBounds={ transformWrapperProps.limitToBounds }
                disablePadding={ transformWrapperProps.disablePadding }
                panning={transformWrapperProps.panning}
                onInit={ onTransformed }
                onTransformed={ onTransformed }
                customTransform={(x, y, s) => `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scale(${s})` }
                wheel={ transformWrapperProps.wheel }
                ref={ TransformWrapperRef }
            >
                <TransformComponent wrapperStyle={ wrapperStyle } contentStyle={ contentStyle(contentHeight, contentWidth) } >
                    {
                        visibleTiles.map((tile: Tile) => (
                            <div key={ tile.key } style={ imagesContainerStyle(tile) }>
                                { tile.content }
                            </div>
                        ))
                    }
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
