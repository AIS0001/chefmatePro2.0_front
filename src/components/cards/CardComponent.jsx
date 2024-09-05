import React from 'react';
import PropTypes from 'prop-types';

const CardComponent = ({ title, headerContent, children, headerColor, bodyClass, pull }) => {
    return (
        <div className={`panel panel-${headerColor} card-view`}>
            <div className="panel-heading">
                <div className={`pull-${pull}`}>
                    <h6 className="panel-title txt-light">{title}</h6>
                    <div className="card-header-actions">
                        {headerContent}
                    </div>
                </div>
                <div className="clearfix"></div>
            </div>
            <div class="panel-wrapper collapse in">
                <div class={`card-body ${bodyClass}`}>
                    {children}

                </div>
            </div>

        </div>
    );
};

CardComponent.propTypes = {

    title: PropTypes.string.isRequired,
    pull: PropTypes.string.isRequired,
    headerContent: PropTypes.node,
    children: PropTypes.node.isRequired,
    headerColor: PropTypes.string,
    bodyClass: PropTypes.string,
};

CardComponent.defaultProps = {
    headerColor: 'card-header-light', // Default class for light header color
    bodyClass: '',
};

export default CardComponent;
